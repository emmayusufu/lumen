from unittest.mock import AsyncMock, MagicMock

import pytest

from app.agents.inline.graph import run_inline_graph
from app.agents.inline.state import InlineAIState


class _FakeLLM:
    def __init__(self, chunks: list[str], editor_response: str = '{"ok": true}') -> None:
        self._chunks = chunks
        self.ainvoke = AsyncMock(return_value=MagicMock(content=editor_response))

    async def astream(self, _messages):
        for c in self._chunks:
            yield MagicMock(content=c)


@pytest.mark.asyncio
async def test_graph_skips_editor_for_grammar():
    emitted: list[tuple[str, dict]] = []

    async def emit(event: str, data: dict) -> None:
        emitted.append((event, data))

    state: InlineAIState = {"action": "grammar", "selection": "origianl", "draft": ""}
    llm = _FakeLLM(["fixed text"])
    result = await run_inline_graph(state, emit, llm)

    assert result["final"] == "fixed text"
    assert llm.ainvoke.await_count == 0
    assert any(e[0] == "done" for e in emitted)


@pytest.mark.asyncio
async def test_graph_runs_editor_for_improve():
    emitted: list[tuple[str, dict]] = []

    async def emit(event: str, data: dict) -> None:
        emitted.append((event, data))

    state: InlineAIState = {"action": "improve", "selection": "original", "draft": ""}
    llm = _FakeLLM(["better text"], editor_response='{"ok": true, "issues": []}')
    result = await run_inline_graph(state, emit, llm)

    assert result["final"] == "better text"
    assert llm.ainvoke.await_count == 1


@pytest.mark.asyncio
async def test_graph_emits_done_with_final():
    emitted: list[tuple[str, dict]] = []

    async def emit(event: str, data: dict) -> None:
        emitted.append((event, data))

    state: InlineAIState = {"action": "continue", "selection": "", "context": "", "draft": ""}
    llm = _FakeLLM(["and then", " more text"])
    result = await run_inline_graph(state, emit, llm)

    done_events = [e for e in emitted if e[0] == "done"]
    assert len(done_events) == 1
    assert done_events[0][1]["final"] == "and then more text"
    assert result["final"] == "and then more text"
