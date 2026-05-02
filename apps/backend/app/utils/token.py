import os
import secrets
import time
from typing import Any

import jwt

from app.config import TOKEN_TTL_DAYS as _TTL_DAYS

_SECRET = os.environ.get("SECRET_KEY", "dev-secret-change-in-production!")
_ALGORITHM = "HS256"


def create_token(user_id: str, email: str, name: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "jti": secrets.token_hex(16),
        "iat": int(time.time()),
        "exp": int(time.time()) + _TTL_DAYS * 24 * 60 * 60,
    }
    return jwt.encode(payload, _SECRET, algorithm=_ALGORITHM)


def create_ws_token(user_id: str, name: str) -> str:
    from datetime import UTC, datetime, timedelta

    payload = {
        "sub": user_id,
        "name": name,
        "exp": datetime.now(UTC) + timedelta(hours=2),
    }
    return jwt.encode(payload, _SECRET, algorithm=_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, _SECRET, algorithms=[_ALGORITHM])
