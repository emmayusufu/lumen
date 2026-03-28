from unittest.mock import patch, MagicMock

from langchain_core.messages import AIMessage

from app.agents.coder import coder_node
from app.agents.planner import planner_node
from app.agents.researcher import researcher_node
from app.agents.writer import writer_node
from app.state import ResearchState


def test_planner_produces_sub_tasks():
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = AIMessage(
        content="1. Search FastAPI WebSocket docs\n2. Find WebSocket code examples\n3. Compare WebSocket vs SSE"
    )

    state: ResearchState = {
        "query": "How does FastAPI handle WebSockets?",
        "sub_tasks": [],
        "research_results": [],
        "code_results": [],
        "synthesis": "",
        "output": "",
        "output_mode": "chat",
        "messages": [],
        "next_agent": "",
    }

    with patch("app.agents.planner.llm", mock_llm):
        result = planner_node(state)

    assert "sub_tasks" in result
    assert len(result["sub_tasks"]) > 0


def test_researcher_produces_results():
    mock_search = MagicMock(
        return_value=[
            {
                "title": "FastAPI Docs",
                "url": "https://fastapi.tiangolo.com",
                "snippet": "FastAPI framework",
            }
        ]
    )
    mock_reader = MagicMock(
        return_value={
            "title": "FastAPI",
            "content": "FastAPI is a modern framework",
            "url": "https://fastapi.tiangolo.com",
        }
    )

    state: ResearchState = {
        "query": "FastAPI WebSocket",
        "sub_tasks": ["FastAPI WebSocket documentation"],
        "research_results": [],
        "code_results": [],
        "synthesis": "",
        "output": "",
        "output_mode": "chat",
        "messages": [],
        "next_agent": "",
    }

    with (
        patch("app.agents.researcher.search_web", mock_search),
        patch("app.agents.researcher.read_url", mock_reader),
    ):
        result = researcher_node(state)

    assert "research_results" in result
    assert len(result["research_results"]) > 0


def test_coder_produces_code_results():
    mock_github = MagicMock(
        return_value=[
            {
                "repo": "user/repo",
                "path": "main.py",
                "url": "https://github.com/user/repo/blob/main/main.py",
                "name": "main.py",
            }
        ]
    )
    mock_reader = MagicMock(
        return_value={
            "title": "main.py",
            "content": "def hello(): pass",
            "url": "https://github.com/user/repo",
        }
    )

    state: ResearchState = {
        "query": "FastAPI WebSocket example",
        "sub_tasks": ["FastAPI WebSocket code examples"],
        "research_results": [],
        "code_results": [],
        "synthesis": "",
        "output": "",
        "output_mode": "chat",
        "messages": [],
        "next_agent": "",
    }

    with (
        patch("app.agents.coder.search_github_code", mock_github),
        patch("app.agents.coder.read_url", mock_reader),
    ):
        result = coder_node(state)

    assert "code_results" in result
    assert len(result["code_results"]) > 0


def test_writer_chat_mode():
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = AIMessage(
        content="FastAPI supports WebSockets natively [1](https://fastapi.tiangolo.com)."
    )

    state: ResearchState = {
        "query": "How does FastAPI handle WebSockets?",
        "sub_tasks": [],
        "research_results": [
            {
                "source_url": "https://fastapi.tiangolo.com",
                "title": "FastAPI",
                "content_summary": "WebSocket support",
                "relevance_score": 1.0,
            }
        ],
        "code_results": [
            {
                "source_url": "https://github.com/example",
                "language": "python",
                "code_snippet": "async def ws():",
                "description": "example",
            }
        ],
        "synthesis": "",
        "output": "",
        "output_mode": "chat",
        "messages": [],
        "next_agent": "",
    }

    with patch("app.agents.writer.llm", mock_llm):
        result = writer_node(state)

    assert "output" in result
    assert len(result["output"]) > 0


def test_writer_report_mode():
    mock_llm = MagicMock()
    mock_llm.invoke.return_value = AIMessage(
        content="## Summary\nFastAPI WebSocket support\n## Sources\n- https://fastapi.tiangolo.com"
    )

    state: ResearchState = {
        "query": "How does FastAPI handle WebSockets?",
        "sub_tasks": [],
        "research_results": [
            {
                "source_url": "https://fastapi.tiangolo.com",
                "title": "FastAPI",
                "content_summary": "WebSocket support",
                "relevance_score": 1.0,
            }
        ],
        "code_results": [],
        "synthesis": "",
        "output": "",
        "output_mode": "report",
        "messages": [],
        "next_agent": "",
    }

    with patch("app.agents.writer.llm", mock_llm):
        result = writer_node(state)

    assert "output" in result
    assert len(result["output"]) > 0
