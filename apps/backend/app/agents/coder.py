from langchain_core.messages import AIMessage

from app.tools.doc_reader import read_url
from app.tools.github_search import search_github_code


def coder_node(state: dict) -> dict:
    all_results = []

    for task in state["sub_tasks"]:
        github_results = search_github_code.invoke({"query": task})

        for gr in github_results[:3]:
            page = read_url.invoke({"url": gr["url"]})

            if "error" in page:
                continue

            all_results.append(
                {
                    "source_url": gr["url"],
                    "language": _guess_language(gr.get("name", "")),
                    "code_snippet": page.get("content", "")[:3000],
                    "description": f"{gr['repo']} — {gr['path']}",
                }
            )

    summary = f"Found {len(all_results)} code examples across {len(state['sub_tasks'])} sub-tasks."

    return {
        "code_results": all_results,
        "messages": [AIMessage(content=summary, name="coder")],
    }


def _guess_language(filename: str) -> str:
    ext_map = {
        ".py": "python",
        ".js": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".jsx": "javascript",
        ".go": "go",
        ".rs": "rust",
        ".java": "java",
        ".rb": "ruby",
    }
    for ext, lang in ext_map.items():
        if filename.endswith(ext):
            return lang
    return "text"
