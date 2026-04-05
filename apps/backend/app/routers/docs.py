import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.db import docs as db
from app.db import users as users_db
from app.middleware.auth import current_user
from app.models.user import User

router = APIRouter(prefix="/api/content/docs")


class CreateDocRequest(BaseModel):
    title: str = "Untitled"


class UpdateDocRequest(BaseModel):
    title: str | None = None
    content: str | None = None


class AddCollaboratorRequest(BaseModel):
    email: str
    role: str


@router.post("", status_code=201)
async def create_doc(body: CreateDocRequest, user: User = Depends(current_user)):
    doc_id = await db.create_doc(user.id, body.title)
    return {"id": str(doc_id)}


@router.get("")
async def list_docs(user: User = Depends(current_user)):
    rows = await db.list_docs(user.id)
    return [
        {
            "id": str(r["id"]),
            "title": r["title"],
            "updated_at": r["updated_at"].isoformat(),
            "owner_id": r["owner_id"],
            "role": r["role"],
        }
        for r in rows
    ]


@router.get("/{doc_id}")
async def get_doc(doc_id: uuid.UUID, user: User = Depends(current_user)):
    role = await db.get_role(doc_id, user.id)
    if not role:
        raise HTTPException(status_code=403)
    doc = await db.get_doc(doc_id)
    if not doc:
        raise HTTPException(status_code=404)
    collaborators = await db.list_collaborators(doc_id)
    return {
        "id": str(doc["id"]),
        "title": doc["title"],
        "content": doc["content"],
        "owner_id": doc["owner_id"],
        "updated_at": doc["updated_at"].isoformat(),
        "role": role,
        "collaborators": [
            {
                "user_id": c["user_id"],
                "role": c["role"],
                "display_name": c["display_name"],
                "email": c["email"],
            }
            for c in collaborators
        ],
    }


@router.patch("/{doc_id}", status_code=204)
async def update_doc(doc_id: uuid.UUID, body: UpdateDocRequest, user: User = Depends(current_user)):
    role = await db.get_role(doc_id, user.id)
    if not role or role == "viewer":
        raise HTTPException(status_code=403)
    await db.update_doc(doc_id, body.title, body.content)


@router.delete("/{doc_id}", status_code=204)
async def delete_doc(doc_id: uuid.UUID, user: User = Depends(current_user)):
    role = await db.get_role(doc_id, user.id)
    if role != "owner":
        raise HTTPException(status_code=403)
    await db.delete_doc(doc_id)


@router.post("/{doc_id}/collaborators", status_code=201)
async def add_collaborator(
    doc_id: uuid.UUID, body: AddCollaboratorRequest, user: User = Depends(current_user)
):
    role = await db.get_role(doc_id, user.id)
    if role != "owner":
        raise HTTPException(status_code=403)
    if body.role not in ("editor", "viewer"):
        raise HTTPException(status_code=422, detail="role must be 'editor' or 'viewer'")
    target = await users_db.get_user_by_email(body.email)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target["zitadel_user_id"] == user.id:
        raise HTTPException(status_code=422, detail="Cannot add owner as collaborator")
    await db.add_collaborator(doc_id, target["zitadel_user_id"], body.role)


@router.delete("/{doc_id}/collaborators/{collab_user_id}", status_code=204)
async def remove_collaborator(
    doc_id: uuid.UUID, collab_user_id: str, user: User = Depends(current_user)
):
    role = await db.get_role(doc_id, user.id)
    if role != "owner":
        raise HTTPException(status_code=403)
    await db.remove_collaborator(doc_id, collab_user_id)
