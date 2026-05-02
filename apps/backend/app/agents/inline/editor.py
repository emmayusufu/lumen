import json
from collections.abc import Awaitable, Callable
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.inline.prompts import EDITOR_SYSTEM_PROMPT
from app.agents.inline.state import InlineAIState

EmitCallback = Callable[[str, dict], Awaitable[None]]


def _build_editor_user(state: InlineAIState) -> str:
    action = state["action"]
    tone = state.get("tone")
    action_desc = action + (f" (tone={tone})" if tone else "")
    return (
        f"Requested action: {action_desc}\n\n"
        f"Original text:\n{state.get('selection', '')}\n\n"
        f"Draft output:\n{state.get('draft', '')}"
    )


def _parse_editor_response(text: str) -> dict:
    try:
        return json.loads(text.strip())
    except (json.JSONDecodeError, ValueError):
        return {"ok": True, "issues": []}


async def editor_node(
    state: InlineAIState,
    emit: EmitCallback,
    llm: Any,
) -> InlineAIState:
    await emit("status", {"stage": "refining"})
    response = await llm.ainvoke(
        [
            SystemMessage(content=EDITOR_SYSTEM_PROMPT),
            HumanMessage(content=_build_editor_user(state)),
        ]
    )
    parsed = _parse_editor_response(getattr(response, "content", "") or "")
    if parsed.get("ok") or not parsed.get("revised"):
        state["final"] = state.get("draft", "")
        state["issues"] = []
        return state
    revised = parsed["revised"]
    state["final"] = revised
    state["issues"] = parsed.get("issues", [])
    await emit("revision", {"text": revised})
    return state
