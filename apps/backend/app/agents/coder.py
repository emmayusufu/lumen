from langchain_core.messages import AIMessage

from app.tools.github_search import search_github_code


def coder_node(state: dict) -> dict:
    all_results = []

    for task in state["sub_tasks"][:2]:
        github_results = search_github_code.invoke({"query": task, "max_results": 3})

        for gr in github_results:
            all_results.append({
                "source_url": gr["url"],
                "language": _guess_language(gr.get("name", "")),
                "code_snippet": "",
                "description": f"{gr['repo']} — {gr['path']}",
            })

    summary = f"Found {len(all_results)} code examples."

    return {
        "code_results": all_results,
        "messages": [AIMessage(content=summary, name="coder")],
    }


def _guess_language(filename: str) -> str:
    ext_map = {
        ".py": "python", ".js": "javascript", ".ts": "typescript",
        ".tsx": "typescript", ".jsx": "javascript", ".go": "go",
        ".rs": "rust", ".java": "java", ".rb": "ruby",
    }
    for ext, lang in ext_map.items():
        if filename.endswith(ext):
            return lang
    return "text"
