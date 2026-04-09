import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    github_token: str = ""

    model_config = {"env_file": os.environ.get("ENV_FILE", ".env")}


settings = Settings()

OPA_URL: str = os.environ.get("OPA_URL", "http://opa:8181")
TOKEN_TTL_DAYS: int = 7
