from collections.abc import Callable

import httpx
import jwt
from fastapi import HTTPException, Request
from fastapi.responses import Response

from app.config import OPA_URL
from app.models.user import User
from app.utils.token import decode_token


async def attach_user(request: Request, call_next: Callable) -> Response:
    token = request.cookies.get("token") or _bearer(request)
    user = User(id="", org_id="", email="")
    if token:
        try:
            payload = decode_token(token)
            if not await _is_revoked(payload["jti"]):
                user = User(
                    id=payload["sub"],
                    org_id=payload["org_id"],
                    email=payload["email"],
                    name=payload.get("name", ""),
                )
        except jwt.PyJWTError:
            pass
    request.state.user = user
    return await call_next(request)


def current_user(request: Request) -> User:
    if not request.state.user.id:
        raise HTTPException(status_code=401)
    return request.state.user


def _bearer(request: Request) -> str | None:
    auth = request.headers.get("authorization", "")
    return auth[7:] if auth.startswith("Bearer ") else None


async def _is_revoked(jti: str) -> bool:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{OPA_URL}/v1/data/jwt/allow",
                json={"input": {"jti": jti}},
                timeout=3.0,
            )
            return not resp.json().get("result", False)
    except Exception:
        return False
