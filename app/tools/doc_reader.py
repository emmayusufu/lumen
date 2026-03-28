import httpx
from bs4 import BeautifulSoup
from langchain_core.tools import tool


@tool
def read_url(url: str) -> dict:
    """Fetch a URL and extract the main text content."""
    try:
        response = httpx.get(url, timeout=10, follow_redirects=True, verify=False)
        response.raise_for_status()
    except (httpx.HTTPError, httpx.TimeoutException) as e:
        return {"error": str(e), "url": url}

    soup = BeautifulSoup(response.text, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    title = soup.title.string.strip() if soup.title and soup.title.string else ""

    main = soup.find("main") or soup.find("article") or soup.body
    text = main.get_text(separator="\n", strip=True) if main else ""

    if len(text) > 8000:
        text = text[:8000]

    return {"title": title, "content": text, "url": url}
