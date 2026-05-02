import bcrypt
import jwt
from asyncpg import UniqueViolationError
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field

from app.config import OPA_URL, TOKEN_TTL_DAYS
from app.db import users as db
from app.db import workspaces as workspaces_db
from app.middleware.auth import current_user
from app.middleware.opa import opa_client
from app.middleware.ratelimit import rate_limit_ip
from app.models.user import User
from app.utils.token import create_token, create_ws_token, decode_token

_COOKIE = "token"
_COOKIE_MAX_AGE = TOKEN_TTL_DAYS * 24 * 60 * 60

router = APIRouter(prefix="/api/v1/auth")


class SignupRequest(BaseModel):
    firstName: str = Field(min_length=1, max_length=80)  # noqa: N815
    lastName: str = Field(min_length=1, max_length=80)  # noqa: N815
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)
    workspaceName: str = Field(default="", max_length=120)  # noqa: N815


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


def _set_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        path="/",
        max_age=_COOKIE_MAX_AGE,
    )


@router.post(
    "/signup",
    status_code=201,
    dependencies=[Depends(rate_limit_ip(per_minute=2, per_hour=5, scope="signup"))],
)
async def signup(body: SignupRequest, response: Response):
    email = body.email.lower()
    name = f"{body.firstName} {body.lastName}".strip()
    workspace_name = (body.workspaceName or "").strip() or f"{body.firstName}'s workspace"
    password_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt(12)).decode()
    try:
        workspace_id, workspace_slug, user_id = await workspaces_db.create_workspace_and_admin(
            workspace_name,
            email,
            password_hash,
            name,
        )
    except UniqueViolationError as e:
        raise HTTPException(status_code=400, detail="Email already in use") from e
    token = create_token(user_id, email, name)
    _set_cookie(response, token)
    return {
        "id": user_id,
        "email": email,
        "name": name,
        "workspace": {"id": str(workspace_id), "slug": workspace_slug, "name": workspace_name},
    }


@router.post(
    "/login", dependencies=[Depends(rate_limit_ip(per_minute=5, per_hour=30, scope="login"))]
)
async def login(body: LoginRequest, response: Response):
    user = await db.get_user_for_auth(body.email)
    if not user or not bcrypt.checkpw(body.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["email"], user["name"])
    _set_cookie(response, token)
    return {"id": user["id"], "email": user["email"], "name": user["name"]}


@router.post("/logout", status_code=204)
async def logout(request: Request, response: Response):
    raw = request.cookies.get(_COOKIE)
    if raw:
        try:
            payload = decode_token(raw)
        except jwt.PyJWTError:
            payload = None
        if payload:
            await _revoke(payload["jti"], int(payload["exp"]))
    response.delete_cookie(key=_COOKIE, path="/")


@router.get("/ws-token")
async def ws_token(user: User = Depends(current_user)):
    return {"token": create_ws_token(user.id, user.name)}


@router.get("/me")
async def me(user: User = Depends(current_user)):
    return {"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin}


@router.delete("/me", status_code=204)
async def delete_me(request: Request, response: Response, user: User = Depends(current_user)):
    await db.anonymize_user(user.id)
    raw = request.cookies.get(_COOKIE)
    if raw:
        try:
            payload = decode_token(raw)
            await _revoke(payload["jti"], int(payload["exp"]))
        except jwt.PyJWTError:
            pass
    response.delete_cookie(key=_COOKIE, path="/")


async def _revoke(jti: str, exp: int) -> None:
    await opa_client().patch(
        f"{OPA_URL}/v1/data/revoked_tokens",
        headers={"Content-Type": "application/json-patch+json"},
        content=f'[{{"op":"add","path":"/{jti}","value":{exp}}}]',
        timeout=3.0,
    )
