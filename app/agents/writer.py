import json

from langchain_core.messages import AIMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.config import settings

llm = ChatOpenAI(
    model=settings.deepseek_model,
    api_key=settings.deepseek_api_key,
    base_url=settings.deepseek_base_url,
)

CHAT_PROMPT = """You are a technical writing assistant. Given research results and code examples, write a clear, conversational answer with inline citations.

Use [source title](url) format for citations. Be concise but thorough.

Research results:
{research_results}

Code examples:
{code_results}"""

REPORT_PROMPT = """You are a technical report writer. Given research results and code examples, write a structured markdown report with these sections:

## Summary
Brief overview of findings.

## Key Findings
Detailed findings with citations.

## Code Examples
Relevant code with explanations.

## Sources
List all sources as clickable links.

Research results:
{research_results}

Code examples:
{code_results}"""


def writer_node(state: dict) -> dict:
    research_json = json.dumps(state["research_results"][:10], indent=2)
    code_json = json.dumps(state["code_results"][:10], indent=2)

    if state["output_mode"] == "report":
        prompt = REPORT_PROMPT.format(
            research_results=research_json, code_results=code_json
        )
    else:
        prompt = CHAT_PROMPT.format(
            research_results=research_json, code_results=code_json
        )

    response = llm.invoke(
        [
            SystemMessage(content=prompt),
            *state["messages"],
        ]
    )

    return {
        "output": response.content,
        "messages": [AIMessage(content=response.content, name="writer")],
    }
