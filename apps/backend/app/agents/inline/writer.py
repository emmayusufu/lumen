from collections.abc import Awaitable, Callable
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.inline.prompts import INLINE_PROMPTS
from app.agents.inline.state import InlineAIState

EmitCallback = Callable[[str, dict], Awaitable[None]]


def _build_system(state: InlineAIState) -> str:
    action = state["action"]
    template = INLINE_PROMPTS[action]
    if action == "tone":
        return template.format(tone=state.get("tone") or "professional")
    if action == "custom":
        return template.format(prompt=state.get("prompt") or "")
    return template


def _build_user_message(state: InlineAIState) -> str:
    parts: list[str] = []
    if state.get("context"):
        parts.append(f"Surrounding context:\n{state['context']}")
    if state.get("selection"):
        parts.append(f"Text to operate on:\n{state['selection']}")
    if state.get("topic"):
        parts.append(f"Topic:\n{state['topic']}")
    return "\n\n".join(parts) if parts else "(no input)"


async def writer_node(
    state: InlineAIState,
    emit: EmitCallback,
    llm: Any,
) -> InlineAIState:
    system = _build_system(state)
    user = _build_user_message(state)
    draft = ""
    async for chunk in llm.astream([SystemMessage(content=system), HumanMessage(content=user)]):
        token = getattr(chunk, "content", "") or ""
        if not token:
            continue
        draft += token
        await emit("token", {"text": token})
    state["draft"] = draft
    await emit("draft_complete", {"text": draft})
    return state
