from typing import Annotated, Literal

from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class ResearchState(TypedDict):
    query: str
    sub_tasks: list[str]
    research_results: list[dict]
    code_results: list[dict]
    synthesis: str
    output: str
    output_mode: Literal["chat", "report"]
    messages: Annotated[list[AnyMessage], add_messages]
    next_agent: str
