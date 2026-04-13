import asyncio
import json
from typing import Literal

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agents.inline.graph import run_inline_graph
from app.agents.inline.llm_client import get_inline_llm
from app.agents.inline.state import InlineAIState
from app.middleware.auth import current_user
from app.models.user import User

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
    user: User = Depends(current_user),
) -> StreamingResponse:
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
            await run_inline_graph(state, emit, get_inline_llm())
        except Exception as exc:
            await queue.put(("error", {"message": str(exc)}))
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
