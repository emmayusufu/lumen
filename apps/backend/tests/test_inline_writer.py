from unittest.mock import MagicMock

import pytest

from app.agents.inline.state import InlineAIState
from app.agents.inline.writer import writer_node


class _FakeLLM:
    def __init__(self, chunks: list[str]) -> None:
        self._chunks = chunks

    async def astream(self, _messages):
        for c in self._chunks:
            yield MagicMock(content=c)


@pytest.mark.asyncio
async def test_writer_streams_tokens_and_fills_draft():
    emitted: list[tuple[str, dict]] = []

    async def emit(event: str, data: dict) -> None:
        emitted.append((event, data))

    state: InlineAIState = {
        "action": "improve",
        "selection": "original text",
        "context": "",
        "draft": "",
    }
    llm = _FakeLLM(["Hello ", "world."])
    result = await writer_node(state, emit, llm)

    assert result["draft"] == "Hello world."
    token_events = [e for e in emitted if e[0] == "token"]
    assert len(token_events) == 2
    assert token_events[0][1]["text"] == "Hello "
    assert token_events[1][1]["text"] == "world."
    assert ("draft_complete", {"text": "Hello world."}) in emitted


@pytest.mark.asyncio
async def test_writer_formats_tone_prompt():
    emitted: list[tuple[str, dict]] = []

    async def emit(event: str, data: dict) -> None:
        emitted.append((event, data))

    captured_messages: list = []

    class CapturingLLM:
        async def astream(self, messages):
            captured_messages.extend(messages)
            yield MagicMock(content="ok")

    state: InlineAIState = {
        "action": "tone",
        "tone": "casual",
        "selection": "Good day, sir.",
        "draft": "",
    }
    await writer_node(state, emit, CapturingLLM())
    system_content = captured_messages[0].content
    assert "casual" in system_content
