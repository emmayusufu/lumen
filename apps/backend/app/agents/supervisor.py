from typing import Literal

from langgraph.graph import END
from langgraph.types import Command


def supervisor_node(
    state: dict,
) -> Command[Literal["planner", "researcher", "coder", "writer", "__end__"]]:
    if not state.get("sub_tasks"):
        return Command(goto="planner", update={"next_agent": "planner"})

    if not state.get("research_results"):
        return Command(goto="researcher", update={"next_agent": "researcher"})

    if not state.get("code_results"):
        return Command(goto="coder", update={"next_agent": "coder"})

    if not state.get("output"):
        return Command(goto="writer", update={"next_agent": "writer"})

    return Command(goto=END, update={"next_agent": "done"})
