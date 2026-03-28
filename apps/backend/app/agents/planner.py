from langchain_core.messages import AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from app.config import settings

llm = ChatOpenAI(
    model=settings.deepseek_model,
    api_key=settings.deepseek_api_key,
    base_url=settings.deepseek_base_url,
)

SYSTEM_PROMPT = """You are a research planner. Given a technical query, break it down into 2-5 focused sub-tasks for research.

Return ONLY a numbered list of sub-tasks, one per line. Each sub-task should be a specific, searchable query.

Example:
1. Search for official FastAPI WebSocket documentation
2. Find FastAPI WebSocket code examples on GitHub
3. Compare WebSocket vs SSE performance in FastAPI"""


def planner_node(state: dict) -> dict:
    response = llm.invoke(
        [
            SystemMessage(content=SYSTEM_PROMPT),
            *state["messages"],
        ]
    )

    lines = response.content.strip().split("\n")
    sub_tasks = []
    for line in lines:
        cleaned = line.strip().lstrip("0123456789.-) ").strip()
        if cleaned:
            sub_tasks.append(cleaned)

    return {
        "sub_tasks": sub_tasks,
        "messages": [AIMessage(content=response.content, name="planner")],
    }
