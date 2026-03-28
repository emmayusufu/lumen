from typing import Literal

from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END
from langgraph.types import Command
from pydantic import BaseModel, Field

from app.config import settings

llm = ChatOpenAI(
    model=settings.deepseek_model,
    api_key=settings.deepseek_api_key,
    base_url=settings.deepseek_base_url,
)

SYSTEM_PROMPT = """You are a research supervisor managing a team of agents:
- planner: breaks a query into focused sub-tasks (use FIRST)
- researcher: searches the web and reads documentation
- coder: searches GitHub for code examples
- writer: produces the final answer (use LAST, after gathering enough data)

Routing rules:
1. Always start with planner if sub_tasks is empty
2. After planner, route to researcher and/or coder
3. You may re-route to researcher or coder if results seem insufficient
4. Route to writer only when you have enough research and code results
5. Say FINISH only after writer has produced output

Current state summary:
- Sub-tasks: {sub_task_count}
- Research results: {research_count}
- Code results: {code_count}
- Has output: {has_output}"""


class Router(BaseModel):
    next: Literal["planner", "researcher", "coder", "writer", "FINISH"] = Field(
        description="The next agent to route to, or FINISH if done."
    )


def supervisor_node(
    state: dict,
) -> Command[Literal["planner", "researcher", "coder", "writer", "__end__"]]:
    prompt = SYSTEM_PROMPT.format(
        sub_task_count=len(state.get("sub_tasks", [])),
        research_count=len(state.get("research_results", [])),
        code_count=len(state.get("code_results", [])),
        has_output=bool(state.get("output", "")),
    )

    response = llm.with_structured_output(Router).invoke(
        [SystemMessage(content=prompt)] + state["messages"]
    )

    goto = response.next
    if goto == "FINISH":
        goto = END

    return Command(goto=goto, update={"next_agent": goto})
