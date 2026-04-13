from langchain_openai import ChatOpenAI

from app.config import settings


def get_inline_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.deepseek_model,
        api_key=settings.deepseek_api_key,
        base_url=settings.deepseek_base_url,
        temperature=0.3,
        streaming=True,
    )
