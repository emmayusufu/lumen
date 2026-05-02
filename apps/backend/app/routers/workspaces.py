import os

from asyncpg import UniqueViolationError
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.db import Acquire
from app.db import workspaces as db
from app.middleware.auth import current_user
from app.middleware.opa import authorize_workspace
from app.models.user import User
from app.models.workspace import Workspace

SITE_URL = (
    os.environ.get("SITE_URL")
    or os.environ.get("NEXT_PUBLIC_SITE_URL")
    or "http://localhost:3847"
).rstrip("/")

router = APIRouter(prefix="/api/v1/w")
workspaces_router = APIRouter(prefix="/api/v1/workspaces")


async def current_workspace(slug: str, user: User = Depends(current_user)) -> Workspace:
    ws = await db.get_by_slug(slug)
    if not ws:
        raise HTTPException(status_code=404)
    role = await db.get_member_role(ws["id"], user.id)
    if not role:
        raise HTTPException(status_code=403)
    return Workspace(id=ws["id"], slug=ws["slug"], name=ws["name"], role=role)


class CreateWorkspaceRequest(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class RenameRequest(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class ChangeRoleRequest(BaseModel):
    role: str


@workspaces_router.get("")
async def list_my_workspaces(user: User = Depends(current_user)):
    rows = await db.list_workspaces_for_user(user.id)
    return [
        {"id": str(r["id"]), "slug": r["slug"], "name": r["name"], "role": r["role"]} for r in rows
    ]


@workspaces_router.post("", status_code=201)
async def create_workspace(body: CreateWorkspaceRequest, user: User = Depends(current_user)):
    async with Acquire() as conn, conn.transaction():
        last_err: UniqueViolationError | None = None
        ws_row = None
        slug = ""
        for _ in range(5):
            slug = db._slugify(body.name)
            try:
                async with conn.transaction():
                    ws_row = await conn.fetchrow(
                        "INSERT INTO workspaces (name, slug, created_by) VALUES ($1, $2, $3) RETURNING id",
                        body.name,
                        slug,
                        user.id,
                    )
                break
            except UniqueViolationError as e:
                last_err = e
        else:
            raise HTTPException(status_code=500, detail="Slug generation failed") from last_err
        ws_id = ws_row["id"]
        await conn.execute(
            "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'admin')",
            ws_id,
            user.id,
        )
    return {"id": str(ws_id), "slug": slug, "name": body.name, "role": "admin"}


@router.get("/{slug}/members")
async def list_members(ws: Workspace = Depends(current_workspace)):
    await authorize_workspace(ws.role, "read_workspace")
    rows = await db.list_members(ws.id)
    return [
        {
            "user_id": r["user_id"],
            "name": r["name"],
            "email": r["email"],
            "role": r["role"],
            "joined_at": r["joined_at"].isoformat(),
        }
        for r in rows
    ]


@router.patch("/{slug}/members/{user_id}", status_code=204)
async def change_member_role(
    user_id: str,
    body: ChangeRoleRequest,
    ws: Workspace = Depends(current_workspace),
):
    await authorize_workspace(ws.role, "change_role")
    if body.role not in ("admin", "editor", "viewer"):
        raise HTTPException(status_code=422, detail="invalid role")
    current_role = await db.get_member_role(ws.id, user_id)
    if current_role == "admin" and body.role != "admin" and await db.count_admins(ws.id) <= 1:
        raise HTTPException(status_code=400, detail="Promote another admin first")
    ok = await db.update_member_role(ws.id, user_id, body.role)
    if not ok:
        raise HTTPException(status_code=404)


@router.delete("/{slug}/members/{user_id}", status_code=204)
async def remove_member(
    user_id: str,
    ws: Workspace = Depends(current_workspace),
    user: User = Depends(current_user),
):
    if user_id != user.id:
        await authorize_workspace(ws.role, "remove_member")
    target_role = await db.get_member_role(ws.id, user_id)
    if not target_role:
        raise HTTPException(status_code=404)
    if target_role == "admin" and await db.count_admins(ws.id) <= 1:
        raise HTTPException(status_code=400, detail="Promote another admin first")
    await db.remove_member(ws.id, user_id)


@router.patch("/{slug}", status_code=204)
async def rename_workspace(
    body: RenameRequest,
    ws: Workspace = Depends(current_workspace),
):
    await authorize_workspace(ws.role, "rename_workspace")
    await db.rename_workspace(ws.id, body.name)


class CreateInviteRequest(BaseModel):
    role: str


@router.post("/{slug}/invites", status_code=201)
async def mint_invite(
    body: CreateInviteRequest,
    ws: Workspace = Depends(current_workspace),
    user: User = Depends(current_user),
):
    await authorize_workspace(ws.role, "invite")
    if body.role not in ("admin", "editor", "viewer"):
        raise HTTPException(status_code=422, detail="invalid role")
    invite = await db.create_invite(ws.id, body.role, user.id)
    return {
        "token": invite["token"],
        "url": f"{SITE_URL}/invite/{invite['token']}",
        "role": invite["role"],
        "expires_at": invite["expires_at"].isoformat(),
    }


@router.get("/{slug}/invites")
async def list_invites(ws: Workspace = Depends(current_workspace)):
    await authorize_workspace(ws.role, "invite")
    rows = await db.list_invites(ws.id)
    return [
        {
            "token": r["token"],
            "url": f"{SITE_URL}/invite/{r['token']}",
            "role": r["role"],
            "expires_at": r["expires_at"].isoformat(),
        }
        for r in rows
    ]


@router.delete("/{slug}/invites/{token}", status_code=204)
async def revoke_invite(
    token: str,
    ws: Workspace = Depends(current_workspace),
):
    await authorize_workspace(ws.role, "invite")
    ok = await db.revoke_invite(ws.id, token)
    if not ok:
        raise HTTPException(status_code=404)
