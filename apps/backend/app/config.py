import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"
    secret_key: str = ""

    model_config = {"env_file": os.environ.get("ENV_FILE", ".env"), "extra": "ignore"}

    def validate_secret_key(self) -> None:
        if len(self.secret_key) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters")


settings = Settings()
settings.validate_secret_key()

OPA_URL: str = os.environ.get("OPA_URL", "http://opa:8181")
TOKEN_TTL_DAYS: int = 7
