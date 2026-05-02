from datetime import UTC, datetime

import bcrypt
from asyncpg import UniqueViolationError
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel

from app.db import users as users_db
from app.db import workspaces as workspaces_db
from app.middleware.auth import current_user
from app.models.user import User
from app.routers.auth import _set_cookie
from app.utils.token import create_token

router = APIRouter(prefix="/api/v1/invites")


class SignupViaInviteRequest(BaseModel):
    firstName: str  # noqa: N815
    lastName: str  # noqa: N815
    email: str
    password: str


@router.get("/{token}")
async def preview_invite(token: str):
    inv = await workspaces_db.get_invite(token)
    if not inv:
        raise HTTPException(status_code=404)
    expired = inv["accepted_at"] is not None or inv["expires_at"] < datetime.now(UTC)
    return {
        "workspace_name": inv["workspace_name"],
        "workspace_slug": inv["workspace_slug"],
        "role": inv["role"],
        "inviter_name": inv["inviter_name"],
        "expired": expired,
    }


@router.post("/{token}/accept")
async def accept_invite(token: str, user: User = Depends(current_user)):
    ws = await workspaces_db.accept_invite(token, user.id)
    if not ws:
        raise HTTPException(status_code=410, detail="Invite expired or invalid")
    return {"id": str(ws["id"]), "slug": ws["slug"], "name": ws["name"]}


@router.post("/{token}/signup", status_code=201)
async def signup_via_invite(token: str, body: SignupViaInviteRequest, response: Response):
    inv = await workspaces_db.get_invite(token)
    if not inv:
        raise HTTPException(status_code=404)
    if inv["accepted_at"] is not None or inv["expires_at"] < datetime.now(UTC):
        raise HTTPException(status_code=410, detail="Invite expired or invalid")
    email = body.email.lower()
    name = f"{body.firstName} {body.lastName}".strip()
    password_hash = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt(12)).decode()
    try:
        user_id = await users_db.create_user(email, password_hash, name)
    except UniqueViolationError as e:
        raise HTTPException(status_code=400, detail="Email already in use") from e
    ws = await workspaces_db.accept_invite(token, user_id)
    if not ws:
        raise HTTPException(status_code=410, detail="Invite expired or invalid")
    token_str = create_token(user_id, email, name)
    _set_cookie(response, token_str)
    return {
        "id": user_id,
        "email": email,
        "name": name,
        "workspace": {"id": str(ws["id"]), "slug": ws["slug"], "name": ws["name"]},
    }
