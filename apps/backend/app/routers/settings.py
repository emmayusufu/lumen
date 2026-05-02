import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.db import credentials as creds_db
from app.db import users as users_db
from app.db import workspaces as workspaces_db
from app.middleware.auth import current_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


class ProfilePatchRequest(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    email: str | None = Field(default=None, max_length=320)
    current_password: str | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=200)


async def _primary_workspace_id(user_id: str) -> uuid.UUID:
    workspaces = await workspaces_db.list_workspaces_for_user(user_id)
    if not workspaces:
        raise HTTPException(status_code=404, detail="No workspace")
    return workspaces[0]["id"]


@router.get("/profile")
async def get_profile(user: User = Depends(current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "is_admin": user.is_admin,
    }


@router.patch("/profile")
async def patch_profile(
    req: ProfilePatchRequest,
    user: User = Depends(current_user),
):
    if req.email is not None and req.email != user.email:
        if not req.current_password:
            raise HTTPException(status_code=400, detail="Current password required to change email")
        if not await users_db.verify_password(user.id, req.current_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        if await users_db.email_exists_for_other_user(req.email, user.id):
            raise HTTPException(status_code=400, detail="That email is already in use")
    await users_db.update_profile(user.id, req.name, req.email)
    return {"ok": True}


@router.post("/password")
async def change_password(
    req: PasswordChangeRequest,
    user: User = Depends(current_user),
):
    if not await users_db.verify_password(user.id, req.current_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await users_db.update_password(user.id, req.new_password)
    return {"ok": True}


class CredentialRequest(BaseModel):
    api_key: str = Field(min_length=8, max_length=500)


def _require_admin(user: User) -> None:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("/credentials")
async def get_credentials(user: User = Depends(current_user)):
    workspace_id = await _primary_workspace_id(user.id)
    return {
        "user": await creds_db.get_user_key_info(user.id),
        "workspace": await creds_db.get_workspace_key_info(workspace_id),
        "serper_user": await creds_db.get_user_serper_key_info(user.id),
        "serper_workspace": await creds_db.get_workspace_serper_key_info(workspace_id),
    }


@router.put("/credentials/user")
async def put_user_credential(
    req: CredentialRequest,
    user: User = Depends(current_user),
):
    await creds_db.set_user_key(user.id, req.api_key)
    return {"ok": True}


@router.delete("/credentials/user")
async def delete_user_credential(user: User = Depends(current_user)):
    await creds_db.delete_user_key(user.id)
    return {"ok": True}


@router.put("/credentials/workspace")
async def put_workspace_credential(
    req: CredentialRequest,
    user: User = Depends(current_user),
):
    _require_admin(user)
    workspace_id = await _primary_workspace_id(user.id)
    await creds_db.set_workspace_key(workspace_id, req.api_key)
    return {"ok": True}


@router.delete("/credentials/workspace")
async def delete_workspace_credential(user: User = Depends(current_user)):
    _require_admin(user)
    workspace_id = await _primary_workspace_id(user.id)
    await creds_db.clear_workspace_key(workspace_id)
    return {"ok": True}


@router.put("/credentials/serper-user")
async def put_serper_user_credential(
    req: CredentialRequest,
    user: User = Depends(current_user),
):
    await creds_db.set_user_serper_key(user.id, req.api_key)
    return {"ok": True}


@router.delete("/credentials/serper-user")
async def delete_serper_user_credential(user: User = Depends(current_user)):
    await creds_db.clear_user_serper_key(user.id)
    return {"ok": True}


@router.put("/credentials/serper-workspace")
async def put_serper_workspace_credential(
    req: CredentialRequest,
    user: User = Depends(current_user),
):
    _require_admin(user)
    workspace_id = await _primary_workspace_id(user.id)
    await creds_db.set_workspace_serper_key(workspace_id, req.api_key)
    return {"ok": True}


@router.delete("/credentials/serper-workspace")
async def delete_serper_workspace_credential(user: User = Depends(current_user)):
    _require_admin(user)
    workspace_id = await _primary_workspace_id(user.id)
    await creds_db.clear_workspace_serper_key(workspace_id)
    return {"ok": True}
