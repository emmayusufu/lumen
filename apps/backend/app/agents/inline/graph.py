from typing import Any, Awaitable, Callable

from app.agents.inline.editor import editor_node
from app.agents.inline.prompts import ACTIONS_REQUIRING_EDITOR
from app.agents.inline.state import InlineAIState
from app.agents.inline.writer import writer_node

EmitCallback = Callable[[str, dict], Awaitable[None]]


async def run_inline_graph(
    state: InlineAIState,
    emit: EmitCallback,
    llm: Any,
) -> InlineAIState:
    await emit("status", {"stage": "writing", "action": state["action"]})
    state = await writer_node(state, emit, llm)
    if state["action"] in ACTIONS_REQUIRING_EDITOR:
        state = await editor_node(state, emit, llm)
    else:
        state["final"] = state.get("draft", "")
    await emit("done", {"final": state.get("final", "")})
    return state
