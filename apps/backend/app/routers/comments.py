import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.db import comments as db
from app.db import docs as docs_db
from app.middleware.auth import current_user
from app.middleware.opa import authorize
from app.models.user import User

router = APIRouter(prefix="/api/v1/content/docs")


class CreateThreadRequest(BaseModel):
    thread_id: uuid.UUID
    body: str = Field(min_length=1, max_length=4000)


class ReplyRequest(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class ResolveRequest(BaseModel):
    resolved: bool


def _serialize_thread(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "doc_id": str(row["doc_id"]),
        "resolved": row["resolved"],
        "created_by": row["created_by"],
        "creator_name": row["creator_name"],
        "creator_email": row["creator_email"],
        "created_at": row["created_at"].isoformat(),
        "messages": [
            {
                **m,
                "created_at": m["created_at"]
                if isinstance(m["created_at"], str)
                else m["created_at"].isoformat(),
            }
            for m in row["messages"]
        ],
    }


@router.get("/{doc_id}/comments")
async def list_comments(doc_id: uuid.UUID, user: User = Depends(current_user)):
    role = await docs_db.get_role(doc_id, user.id)
    await authorize(role, "read")
    rows = await db.list_threads_for_doc(doc_id)
    return [_serialize_thread(r) for r in rows]


@router.post("/{doc_id}/comments", status_code=201)
async def create_thread(
    doc_id: uuid.UUID, body: CreateThreadRequest, user: User = Depends(current_user)
):
    role = await docs_db.get_role(doc_id, user.id)
    await authorize(role, "write")
    result = await db.create_thread(body.thread_id, doc_id, user.id, body.body)
    return {
        "thread_id": str(body.thread_id),
        "message_id": str(result["id"]),
        "created_at": result["created_at"].isoformat(),
    }


thread_router = APIRouter(prefix="/api/v1/content/comments")


async def _authz_thread_write(thread_id: uuid.UUID, user: User) -> None:
    doc_id = await db.get_doc_id(thread_id)
    if not doc_id:
        raise HTTPException(status_code=404)
    role = await docs_db.get_role(doc_id, user.id)
    await authorize(role, "write")


@thread_router.post("/{thread_id}/messages", status_code=201)
async def reply(thread_id: uuid.UUID, body: ReplyRequest, user: User = Depends(current_user)):
    await _authz_thread_write(thread_id, user)
    result = await db.add_message(thread_id, user.id, body.body)
    if not result:
        raise HTTPException(status_code=404)
    return {"message_id": str(result["id"]), "created_at": result["created_at"].isoformat()}


@thread_router.patch("/{thread_id}", status_code=204)
async def set_resolved(
    thread_id: uuid.UUID, body: ResolveRequest, user: User = Depends(current_user)
):
    await _authz_thread_write(thread_id, user)
    ok = await db.set_resolved(thread_id, body.resolved)
    if not ok:
        raise HTTPException(status_code=404)


@thread_router.delete("/{thread_id}", status_code=204)
async def delete_thread(thread_id: uuid.UUID, user: User = Depends(current_user)):
    ok = await db.delete_thread(thread_id, user.id)
    if not ok:
        raise HTTPException(status_code=403, detail="Only the thread creator can delete it")
