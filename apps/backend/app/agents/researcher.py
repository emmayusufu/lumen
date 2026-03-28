from langchain_core.messages import AIMessage

from app.tools.doc_reader import read_url
from app.tools.web_search import search_web


def researcher_node(state: dict) -> dict:
    all_results = []

    for task in state["sub_tasks"]:
        search_results = search_web.invoke({"query": task})

        for sr in search_results[:3]:
            page = read_url.invoke({"url": sr["url"]})

            if "error" in page:
                continue

            all_results.append(
                {
                    "source_url": sr["url"],
                    "title": sr.get("title", page.get("title", "")),
                    "content_summary": page.get("content", sr.get("snippet", ""))[
                        :2000
                    ],
                    "relevance_score": 1.0,
                }
            )

    summary = (
        f"Found {len(all_results)} results across {len(state['sub_tasks'])} sub-tasks."
    )

    return {
        "research_results": all_results,
        "messages": [AIMessage(content=summary, name="researcher")],
    }
