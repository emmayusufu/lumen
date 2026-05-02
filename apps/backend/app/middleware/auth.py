import logging
from collections.abc import Callable

import jwt
from fastapi import HTTPException, Request
from fastapi.responses import Response

from app.config import OPA_URL
from app.db import users as users_db
from app.middleware.opa import opa_client
from app.models.user import User
from app.utils.token import decode_token


async def attach_user(request: Request, call_next: Callable) -> Response:
    token = request.cookies.get("token") or _bearer(request)
    user = User(id="", email="")
    if token:
        try:
            payload = decode_token(token)
            if not await _is_revoked(payload["jti"]):
                db_user = await users_db.get_user_by_id(payload["sub"])
                if db_user:
                    user = User(
                        id=payload["sub"],
                        email=payload["email"],
                        name=payload.get("name", ""),
                        is_admin=bool(db_user.get("is_admin", False)),
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
        resp = await opa_client().post(
            f"{OPA_URL}/v1/data/jwt/allow",
            json={"input": {"jti": jti}},
            timeout=3.0,
        )
        return not resp.json().get("result", False)
    except Exception:
        logging.getLogger("lumen.auth").warning(
            "OPA revocation check failed; accepting token", exc_info=True
        )
        return False
