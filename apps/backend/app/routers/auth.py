import bcrypt
import httpx
import jwt
from asyncpg import UniqueViolationError
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel

from app.config import OPA_URL, TOKEN_TTL_DAYS
from app.db import users as db
from app.middleware.auth import current_user
from app.models.user import User
from app.utils.token import create_token, create_ws_token, decode_token

_COOKIE = "token"
_COOKIE_MAX_AGE = TOKEN_TTL_DAYS * 24 * 60 * 60

router = APIRouter(prefix="/api/v1/auth")


class SignupRequest(BaseModel):
    orgName: str
    firstName: str
    lastName: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


def _set_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        path="/",
        max_age=_COOKIE_MAX_AGE,
    )


@router.post("/signup", status_code=201)
async def signup(body: SignupRequest, response: Response):
    email = body.email.lower()
    name = f"{body.firstName} {body.lastName}".strip()
    password_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt(12)).decode()
    try:
        org_id, user_id = await db.create_org_and_user(body.orgName, email, password_hash, name)
    except UniqueViolationError:
        raise HTTPException(status_code=400, detail="Email already in use")
    token = create_token(user_id, email, org_id, name)
    _set_cookie(response, token)
    return {"id": user_id, "email": email, "name": name}


@router.post("/login")
async def login(body: LoginRequest, response: Response):
    user = await db.get_user_for_auth(body.email)
    if not user or not bcrypt.checkpw(body.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["email"], user["org_id"], user["name"])
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
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "org_id": user.org_id,
        "is_admin": user.is_admin,
    }


async def _revoke(jti: str, exp: int) -> None:
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{OPA_URL}/v1/data/revoked_tokens",
            headers={"Content-Type": "application/json-patch+json"},
            content=f'[{{"op":"add","path":"/{jti}","value":{exp}}}]',
            timeout=3.0,
        )
