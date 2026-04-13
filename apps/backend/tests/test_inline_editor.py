from unittest.mock import AsyncMock, MagicMock

import pytest

from app.agents.inline.editor import editor_node
from app.agents.inline.state import InlineAIState


def _mock_llm(response_content: str):
    llm = MagicMock()
    llm.ainvoke = AsyncMock(return_value=MagicMock(content=response_content))
    return llm


@pytest.mark.asyncio
async def test_editor_keeps_draft_when_ok():
    emitted: list[tuple[str, dict]] = []

    async def emit(event: str, data: dict) -> None:
        emitted.append((event, data))

    state: InlineAIState = {
        "action": "improve",
        "selection": "original",
        "draft": "rewritten version",
    }
    result = await editor_node(state, emit, _mock_llm('{"ok": true, "issues": []}'))
    assert result["final"] == "rewritten version"
    assert not any(e[0] == "revision" for e in emitted)


@pytest.mark.asyncio
async def test_editor_revises_when_not_ok():
    emitted: list[tuple[str, dict]] = []

    async def emit(event: str, data: dict) -> None:
        emitted.append((event, data))

    state: InlineAIState = {
        "action": "tone",
        "tone": "casual",
        "selection": "original",
        "draft": "formal rewrite",
    }
    llm = _mock_llm(
        '{"ok": false, "issues": ["tone drift"], "revised": "polished version"}'
    )
    result = await editor_node(state, emit, llm)
    assert result["final"] == "polished version"
    assert ("revision", {"text": "polished version"}) in emitted
    assert result["issues"] == ["tone drift"]


@pytest.mark.asyncio
async def test_editor_falls_back_to_draft_on_malformed_json():
    emitted: list[tuple[str, dict]] = []

    async def emit(event: str, data: dict) -> None:
        emitted.append((event, data))

    state: InlineAIState = {
        "action": "improve",
        "selection": "original",
        "draft": "rewritten",
    }
    result = await editor_node(state, emit, _mock_llm("not json"))
    assert result["final"] == "rewritten"
    assert not any(e[0] == "revision" for e in emitted)
