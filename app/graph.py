from langgraph.graph import START, StateGraph

from app.agents.coder import coder_node
from app.agents.planner import planner_node
from app.agents.researcher import researcher_node
from app.agents.supervisor import supervisor_node
from app.agents.writer import writer_node
from app.state import ResearchState


def build_graph() -> StateGraph:
    builder = StateGraph(ResearchState)

    builder.add_node("supervisor", supervisor_node)
    builder.add_node("planner", planner_node)
    builder.add_node("researcher", researcher_node)
    builder.add_node("coder", coder_node)
    builder.add_node("writer", writer_node)

    builder.add_edge(START, "supervisor")
    builder.add_edge("planner", "supervisor")
    builder.add_edge("researcher", "supervisor")
    builder.add_edge("coder", "supervisor")
    builder.add_edge("writer", "supervisor")

    return builder.compile()
