from app.tools.doc_reader import read_url
from app.tools.github_search import search_github_code
from app.tools.web_search import search_web


def test_search_web_returns_list():
    results = search_web.invoke({"query": "Python asyncio tutorial"})
    assert isinstance(results, list)
    assert len(results) > 0


def test_search_web_result_structure():
    results = search_web.invoke({"query": "FastAPI documentation"})
    first = results[0]
    assert "title" in first
    assert "url" in first
    assert "snippet" in first


def test_read_url_returns_content():
    result = read_url.invoke({"url": "https://example.com"})
    assert isinstance(result, dict)
    assert "content" in result
    assert "title" in result
    assert len(result["content"]) > 0


def test_read_url_handles_bad_url():
    result = read_url.invoke({"url": "https://thisdomaindoesnotexist12345.com"})
    assert "error" in result


def test_search_github_returns_list():
    results = search_github_code.invoke({"query": "fastapi websocket"})
    assert isinstance(results, list)


def test_search_github_result_structure():
    results = search_github_code.invoke({"query": "langgraph StateGraph"})
    if len(results) > 0:
        first = results[0]
        assert "repo" in first
        assert "path" in first
        assert "url" in first
