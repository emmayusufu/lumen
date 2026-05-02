import asyncio
import json
import logging
import re
import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

from app.agents.inline.graph import run_inline_graph
from app.agents.inline.state import InlineAIState
from app.db import docs as docs_db
from app.db import workspaces as workspaces_db
from app.middleware.opa import authorize
from app.middleware.ratelimit import rate_limit
from app.models.user import User
from app.services.llm_resolver import get_user_llm

log = logging.getLogger("lumen.ai")
router = APIRouter(prefix="/api/v1/ai", tags=["ai"])

ActionName = Literal[
    "improve",
    "shorter",
    "longer",
    "grammar",
    "tone",
    "summarize",
    "continue",
    "outline",
    "custom",
]

ToneName = Literal["professional", "casual", "friendly", "confident", "persuasive"]


class InlineAIRequest(BaseModel):
    action: ActionName
    tone: ToneName | None = None
    prompt: str | None = Field(default=None, max_length=2000)
    selection: str = Field(default="", max_length=8000)
    context: str = Field(default="", max_length=4000)
    topic: str | None = Field(default=None, max_length=500)


def _format_sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.post("/inline")
async def inline_ai(
    req: InlineAIRequest,
    user: User = Depends(rate_limit()),
) -> StreamingResponse:
    workspaces = await workspaces_db.list_workspaces_for_user(user.id)
    workspace_id = workspaces[0]["id"] if workspaces else None
    llm = await get_user_llm(user.id, workspace_id)
    queue: asyncio.Queue = asyncio.Queue()

    async def emit(event: str, data: dict) -> None:
        await queue.put((event, data))

    state: InlineAIState = {
        "action": req.action,
        "selection": req.selection,
        "context": req.context,
        "prompt": req.prompt,
        "tone": req.tone,
        "topic": req.topic,
        "draft": "",
    }

    async def runner() -> None:
        try:
            await run_inline_graph(state, emit, llm)
        except Exception:
            log.exception("inline AI failed for user %s action=%s", user.id, req.action)
            await queue.put(("error", {"message": "AI request failed. Try again."}))
        finally:
            await queue.put(None)

    async def stream():
        task = asyncio.create_task(runner())
        try:
            while True:
                item = await queue.get()
                if item is None:
                    break
                event, data = item
                yield _format_sse(event, data)
        finally:
            if not task.done():
                task.cancel()

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


SummaryLength = Literal["short", "medium", "long"]

_LENGTH_GUIDANCE = {
    "short": "1-2 sentences (a TL;DR). Capture the single most important point.",
    "medium": "a single paragraph of 3-5 sentences. Cover the main points.",
    "long": "2-3 short paragraphs. Cover the main points, then any notable details or open questions.",
}

_HTML_TAG = re.compile(r"<[^>]+>")
_WS = re.compile(r"\s+")


def _strip_html(html: str) -> str:
    text = _HTML_TAG.sub(" ", html)
    return _WS.sub(" ", text).strip()


@router.get("/summarize/{doc_id}")
async def summarize_doc(
    doc_id: uuid.UUID,
    length: SummaryLength = "medium",
    user: User = Depends(rate_limit()),
) -> StreamingResponse:
    role = await docs_db.get_role(doc_id, user.id)
    await authorize(role, "read")
    doc = await docs_db.get_doc(doc_id)
    if not doc:
        raise HTTPException(status_code=404)

    text = _strip_html(doc["content"])
    title = doc["title"].strip() or "Untitled"
    if not text:

        async def empty():
            yield _format_sse("done", {})

        return StreamingResponse(empty(), media_type="text/event-stream")

    workspaces = await workspaces_db.list_workspaces_for_user(user.id)
    workspace_id = workspaces[0]["id"] if workspaces else None
    llm = await get_user_llm(user.id, workspace_id)
    system = SystemMessage(
        content=(
            "You are a concise editor. Summarize the user's document in plain prose. "
            f"Length: {_LENGTH_GUIDANCE[length]} "
            "Do not use headings, bullets, or bold. Do not start with phrases like "
            "'This document discusses' — go straight to the substance."
        )
    )
    user_msg = HumanMessage(content=f"Title: {title}\n\nContent:\n{text[:16000]}")

    async def stream():
        try:
            async for chunk in llm.astream([system, user_msg]):
                token = getattr(chunk, "content", "") or ""
                if token:
                    yield _format_sse("token", {"text": token})
            yield _format_sse("done", {})
        except Exception:
            log.exception("summarize failed for doc %s user %s", doc_id, user.id)
            yield _format_sse("error", {"message": "Summary failed. Try again."})

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
