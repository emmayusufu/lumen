import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from app.db import docs as db
from app.db import users as users_db
from app.db import workspaces as workspaces_db
from app.middleware.auth import current_user
from app.middleware.opa import authorize
from app.models.user import User
from app.services.pdf import render_pdf

router = APIRouter(prefix="/api/v1/content/docs")


class CreateDocRequest(BaseModel):
    title: str = "Untitled"
    workspace_slug: str | None = None
    parent_id: uuid.UUID | None = None


class UpdateDocRequest(BaseModel):
    title: str | None = None
    content: str | None = None


class AddCollaboratorRequest(BaseModel):
    email: str
    role: str


class UpdateVisibilityRequest(BaseModel):
    visibility: str


class MoveDocRequest(BaseModel):
    parent_id: uuid.UUID | None = None


@router.post("", status_code=201)
async def create_doc(body: CreateDocRequest, user: User = Depends(current_user)):
    if body.workspace_slug:
        ws = await workspaces_db.get_by_slug(body.workspace_slug)
        if not ws:
            raise HTTPException(status_code=404, detail="Workspace not found")
        role = await workspaces_db.get_member_role(ws["id"], user.id)
        if not role or role == "viewer":
            raise HTTPException(status_code=403)
        workspace_id = ws["id"]
    else:
        workspaces = await workspaces_db.list_workspaces_for_user(user.id)
        if not workspaces:
            raise HTTPException(status_code=404, detail="No workspace")
        workspace_id = workspaces[0]["id"]

    if body.parent_id is not None:
        parent = await db.get_doc(body.parent_id)
        if not parent or parent["workspace_id"] != workspace_id:
            raise HTTPException(status_code=404, detail="Parent not found in workspace")
        parent_role = await db.get_role(body.parent_id, user.id)
        if parent_role not in ("owner", "editor"):
            raise HTTPException(status_code=403, detail="Cannot add child to this page")

    doc_id = await db.create_doc(user.id, workspace_id, body.title, body.parent_id)
    return {"id": str(doc_id), "workspace_slug": body.workspace_slug}


@router.get("")
async def list_docs(
    workspace_slug: str | None = None,
    user: User = Depends(current_user),
):
    workspace_id: uuid.UUID | None = None
    if workspace_slug:
        ws = await workspaces_db.get_by_slug(workspace_slug)
        if not ws:
            raise HTTPException(status_code=404, detail="Workspace not found")
        role = await workspaces_db.get_member_role(ws["id"], user.id)
        if not role:
            raise HTTPException(status_code=403)
        workspace_id = ws["id"]
    rows = await db.list_docs(user.id, workspace_id)
    return [
        {
            "id": str(r["id"]),
            "title": r["title"],
            "updated_at": r["updated_at"].isoformat(),
            "owner_id": r["owner_id"],
            "workspace_slug": r["workspace_slug"],
            "role": r["role"],
            "parent_id": str(r["parent_id"]) if r["parent_id"] else None,
        }
        for r in rows
    ]


@router.get("/{doc_id}")
async def get_doc(doc_id: uuid.UUID, user: User = Depends(current_user)):
    role = await db.get_role(doc_id, user.id)
    await authorize(role, "read")
    doc = await db.get_doc(doc_id)
    if not doc:
        raise HTTPException(status_code=404)
    collaborators = await db.list_collaborators(doc_id)
    return {
        "id": str(doc["id"]),
        "title": doc["title"],
        "content": doc["content"],
        "owner_id": doc["owner_id"],
        "workspace_id": str(doc["workspace_id"]),
        "workspace_slug": doc["workspace_slug"],
        "visibility": doc["visibility"],
        "parent_id": str(doc["parent_id"]) if doc["parent_id"] else None,
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
    await authorize(role, "write")
    await db.update_doc(doc_id, body.title, body.content)


@router.delete("/{doc_id}", status_code=204)
async def delete_doc(doc_id: uuid.UUID, user: User = Depends(current_user)):
    role = await db.get_role(doc_id, user.id)
    await authorize(role, "delete")
    await db.delete_doc(doc_id)


@router.patch("/{doc_id}/move", status_code=204)
async def move_doc(doc_id: uuid.UUID, body: MoveDocRequest, user: User = Depends(current_user)):
    role = await db.get_role(doc_id, user.id)
    if role != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can move pages")

    if body.parent_id is not None:
        if body.parent_id == doc_id:
            raise HTTPException(status_code=422, detail="Cannot move a page into itself")
        doc = await db.get_doc(doc_id)
        parent = await db.get_doc(body.parent_id)
        if not parent or not doc:
            raise HTTPException(status_code=404)
        if parent["workspace_id"] != doc["workspace_id"]:
            raise HTTPException(status_code=422, detail="Cannot move across workspaces")
        if await db.is_descendant(doc_id, body.parent_id):
            raise HTTPException(status_code=422, detail="Cannot move a page into its own subtree")
        parent_role = await db.get_role(body.parent_id, user.id)
        if parent_role not in ("owner", "editor"):
            raise HTTPException(status_code=403, detail="No permission on target parent")

    await db.move_doc(doc_id, body.parent_id)


@router.get("/{doc_id}/export/pdf")
async def export_pdf(doc_id: uuid.UUID, user: User = Depends(current_user)):
    role = await db.get_role(doc_id, user.id)
    await authorize(role, "read")
    doc = await db.get_doc(doc_id)
    if not doc:
        raise HTTPException(status_code=404)
    pdf_bytes = render_pdf(doc["title"], doc["content"])
    filename = (doc["title"].strip() or "untitled").replace("/", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'},
    )


@router.patch("/{doc_id}/visibility", status_code=204)
async def update_visibility(
    doc_id: uuid.UUID, body: UpdateVisibilityRequest, user: User = Depends(current_user)
):
    role = await db.get_role(doc_id, user.id)
    if role != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can change visibility")
    if body.visibility not in ("private", "workspace"):
        raise HTTPException(status_code=422, detail="visibility must be 'private' or 'workspace'")
    await db.update_visibility(doc_id, body.visibility)


@router.post("/{doc_id}/collaborators", status_code=201)
async def add_collaborator(
    doc_id: uuid.UUID, body: AddCollaboratorRequest, user: User = Depends(current_user)
):
    role = await db.get_role(doc_id, user.id)
    await authorize(role, "manage_collaborators")
    if body.role not in ("editor", "viewer"):
        raise HTTPException(status_code=422, detail="role must be 'editor' or 'viewer'")
    target = await users_db.get_user_by_email(body.email)
    if not target:
        raise HTTPException(
            status_code=404, detail="No account found with that email. Ask them to sign up first."
        )
    if target["id"] == user.id:
        raise HTTPException(status_code=422, detail="Cannot add owner as collaborator")
    await db.add_collaborator(doc_id, target["id"], body.role)


class UpdateCollaboratorRequest(BaseModel):
    role: str


@router.patch("/{doc_id}/collaborators/{collab_user_id}", status_code=204)
async def update_collaborator_role(
    doc_id: uuid.UUID,
    collab_user_id: str,
    body: UpdateCollaboratorRequest,
    user: User = Depends(current_user),
):
    role = await db.get_role(doc_id, user.id)
    await authorize(role, "manage_collaborators")
    if body.role not in ("editor", "viewer"):
        raise HTTPException(status_code=422, detail="role must be 'editor' or 'viewer'")
    await db.add_collaborator(doc_id, collab_user_id, body.role)


@router.delete("/{doc_id}/collaborators/{collab_user_id}", status_code=204)
async def remove_collaborator(
    doc_id: uuid.UUID, collab_user_id: str, user: User = Depends(current_user)
):
    role = await db.get_role(doc_id, user.id)
    await authorize(role, "manage_collaborators")
    await db.remove_collaborator(doc_id, collab_user_id)


collab_router = APIRouter(prefix="/api/v1/content/collaborators", tags=["collaborators"])


@collab_router.get("/my")
async def list_my_collaborators(user: User = Depends(current_user)):
    return await db.list_collaborators_for_owner(user.id)


@collab_router.delete("/{collab_user_id}")
async def bulk_remove(collab_user_id: str, user: User = Depends(current_user)):
    count = await db.bulk_remove_collaborator(user.id, collab_user_id)
    return {"removed_count": count}
