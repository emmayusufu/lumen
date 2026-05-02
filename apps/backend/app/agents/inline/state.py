from typing import TypedDict


class InlineAIState(TypedDict, total=False):
    action: str
    selection: str
    context: str
    prompt: str | None
    tone: str | None
    topic: str | None
    draft: str
    final: str
    issues: list[str]
