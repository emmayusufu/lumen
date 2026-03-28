import httpx
from langchain_core.tools import tool

from app.config import settings


@tool
def search_github_code(query: str, max_results: int = 5) -> list[dict]:
    """Search GitHub for code matching the query."""
    headers = {"Accept": "application/vnd.github.v3+json"}
    if settings.github_token:
        headers["Authorization"] = f"token {settings.github_token}"

    try:
        response = httpx.get(
            "https://api.github.com/search/code",
            params={"q": query, "per_page": max_results},
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()
    except (httpx.HTTPError, httpx.TimeoutException):
        return []

    data = response.json()
    results = []
    for item in data.get("items", []):
        results.append(
            {
                "repo": item.get("repository", {}).get("full_name", ""),
                "path": item.get("path", ""),
                "url": item.get("html_url", ""),
                "name": item.get("name", ""),
            }
        )
    return results
