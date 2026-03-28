from ddgs import DDGS
from langchain_core.tools import tool


@tool
def search_web(query: str, max_results: int = 5) -> list[dict]:
    """Search the web using DuckDuckGo and return results."""
    with DDGS() as ddgs:
        raw_results = list(ddgs.text(query, max_results=max_results))

    results = []
    for r in raw_results:
        results.append(
            {
                "title": r.get("title", ""),
                "url": r.get("href", ""),
                "snippet": r.get("body", ""),
            }
        )
    return results
