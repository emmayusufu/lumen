from langchain_core.messages import AIMessage

from app.tools.doc_reader import read_url
from app.tools.web_search import search_web


def researcher_node(state: dict) -> dict:
    all_results = []

    for task in state["sub_tasks"][:3]:
        search_results = search_web.invoke({"query": task, "max_results": 3})

        for sr in search_results:
            all_results.append({
                "source_url": sr["url"],
                "title": sr.get("title", ""),
                "content_summary": sr.get("snippet", ""),
                "relevance_score": 1.0,
            })

        if search_results:
            top = search_results[0]
            page = read_url.invoke({"url": top["url"]})
            if "error" not in page:
                all_results[len(all_results) - len(search_results)]["content_summary"] = (
                    page.get("content", "")[:2000]
                )

    summary = f"Found {len(all_results)} results across {len(state['sub_tasks'])} sub-tasks."

    return {
        "research_results": all_results,
        "messages": [AIMessage(content=summary, name="researcher")],
    }
