import asyncio
import json
import logging
import re
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, SystemMessage

from app.db import credentials as creds_db
from app.db import docs as docs_db
from app.db import workspaces as workspaces_db
from app.middleware.opa import authorize
from app.middleware.ratelimit import rate_limit
from app.models.user import User
from app.services.llm_resolver import get_user_llm

log = logging.getLogger("lumen.factcheck")

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

_HTML_TAG = re.compile(r"<[^>]+>")
_WS = re.compile(r"\s+")


def _strip_html(html: str) -> str:
    return _WS.sub(" ", _HTML_TAG.sub(" ", html)).strip()


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


async def _get_serper_key(user_id: str, workspace_id: uuid.UUID) -> str | None:
    key = await creds_db.get_user_serper_key(user_id)
    if not key:
        key = await creds_db.get_workspace_serper_key(workspace_id)
    return key


async def _serper_search(query: str, api_key: str) -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                "https://google.serper.dev/search",
                headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
                json={"q": query, "num": 4},
            )
            resp.raise_for_status()
            data = resp.json()
            results = []
            for item in data.get("organic", [])[:4]:
                results.append(
                    {
                        "title": item.get("title", ""),
                        "url": item.get("link", ""),
                        "snippet": item.get("snippet", ""),
                    }
                )
            return results
    except Exception:
        log.warning("serper search failed for query %r", query, exc_info=True)
        return []


@router.get("/factcheck/{doc_id}")
async def factcheck_doc(
    doc_id: uuid.UUID,
    user: User = Depends(rate_limit(per_minute=5, per_hour=30)),
) -> StreamingResponse:
    role = await docs_db.get_role(doc_id, user.id)
    await authorize(role, "read")
    doc = await docs_db.get_doc(doc_id)
    if not doc:
        raise HTTPException(status_code=404)

    workspaces = await workspaces_db.list_workspaces_for_user(user.id)
    workspace_id = workspaces[0]["id"] if workspaces else None
    if not workspace_id:
        raise HTTPException(
            status_code=400, detail={"code": "no_workspace", "message": "No workspace found."}
        )

    serper_key = await _get_serper_key(user.id, workspace_id)
    if not serper_key:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "no_serper_key",
                "message": "Configure a Serper API key in Settings → API Keys.",
            },
        )

    llm = await get_user_llm(user.id, workspace_id)
    text = _strip_html(doc["content"])
    title = doc["title"].strip() or "Untitled"

    if not text.strip():

        async def empty():
            yield _sse("done", {"message": "Document is empty."})

        return StreamingResponse(empty(), media_type="text/event-stream")

    async def stream():
        yield _sse("status", {"message": "Extracting claims…"})
        await asyncio.sleep(0)

        extract_system = SystemMessage(
            content=(
                "You are a fact-checking assistant. Extract factual claims from the text that can be verified "
                "by searching the web — dates, statistics, named assertions, historical facts. "
                "Return a JSON array of objects, each with three keys:\n"
                '"quote": an EXACT verbatim substring from the text (5-20 words) that contains the claim - '
                "copy it character-for-character, do not paraphrase;\n"
                '"claim": a short plain-English description of what is being claimed (max 120 chars);\n'
                '"query": an optimised web search query to verify the claim.\n'
                "Return ONLY the JSON array. No prose. If no verifiable claims exist, return []."
            )
        )
        extract_user = HumanMessage(content=f"Title: {title}\n\nContent:\n{text[:8000]}")

        claims_raw = ""
        try:
            async for chunk in llm.astream([extract_system, extract_user]):
                claims_raw += getattr(chunk, "content", "") or ""
        except Exception:
            log.exception("claim extraction failed")
            yield _sse("error", {"message": "Failed to extract claims."})
            return

        try:
            json_match = re.search(r"\[.*\]", claims_raw, re.DOTALL)
            claims: list[dict] = json.loads(json_match.group()) if json_match else []
        except (json.JSONDecodeError, AttributeError):
            claims = []

        if not claims:
            yield _sse("done", {"message": "No verifiable claims found in this document."})
            return

        yield _sse("claims_found", {"count": len(claims)})
        await asyncio.sleep(0)

        for i, claim_obj in enumerate(claims[:10]):
            claim_text = claim_obj.get("claim", "")
            query = claim_obj.get("query", claim_text)

            quote = claim_obj.get("quote", claim_text)
            yield _sse("claim_start", {"index": i, "claim": claim_text, "quote": quote})
            await asyncio.sleep(0)

            results = await _serper_search(query, serper_key)

            if not results:
                yield _sse(
                    "verdict",
                    {
                        "index": i,
                        "claim": claim_text,
                        "status": "inconclusive",
                        "summary": "No search results found.",
                        "sources": [],
                    },
                )
                await asyncio.sleep(0)
                continue

            sources_text = "\n".join(f"- {r['title']}: {r['snippet']}" for r in results)
            eval_system = SystemMessage(
                content=(
                    "You are a fact-checker. Given a claim and web search results, return a JSON object with:\n"
                    '"status": one of "confirmed", "disputed", or "inconclusive"\n'
                    '"summary": one sentence explaining the verdict, max 120 chars\n'
                    "Base your verdict only on the provided search results. Return ONLY valid JSON."
                )
            )
            eval_user = HumanMessage(
                content=(f"Claim: {claim_text}\n\nSearch results:\n{sources_text}")
            )

            verdict_raw = ""
            try:
                async for chunk in llm.astream([eval_system, eval_user]):
                    verdict_raw += getattr(chunk, "content", "") or ""
            except Exception:
                log.warning("verdict evaluation failed for claim %d", i, exc_info=True)
                verdict_raw = ""

            try:
                json_match = re.search(r"\{.*\}", verdict_raw, re.DOTALL)
                verdict_obj = json.loads(json_match.group()) if json_match else {}
            except (json.JSONDecodeError, AttributeError):
                verdict_obj = {}

            yield _sse(
                "verdict",
                {
                    "index": i,
                    "claim": claim_text,
                    "quote": quote,
                    "status": verdict_obj.get("status", "inconclusive"),
                    "summary": verdict_obj.get("summary", "Could not evaluate."),
                    "sources": results,
                },
            )
            await asyncio.sleep(0)

        yield _sse("done", {})

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
