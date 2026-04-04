import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.db import sessions as db
from app.middleware.auth import current_user
from app.models.user import User

router = APIRouter(prefix="/api/sessions")


@router.get("")
async def list_sessions(user: User = Depends(current_user)):
    rows = await db.list_sessions(user.id)
    return [
        {"id": str(r["id"]), "title": r["title"], "updated_at": r["updated_at"].isoformat()}
        for r in rows
    ]


@router.get("/{session_id}")
async def get_session(session_id: uuid.UUID, user: User = Depends(current_user)):
    result = await db.get_session(session_id, user.id)
    if not result:
        raise HTTPException(status_code=404)
    return {
        "id": str(result["id"]),
        "title": result["title"],
        "updated_at": result["updated_at"].isoformat(),
        "messages": [
            {
                "role": m["role"],
                "content": m["content"],
                "created_at": m["created_at"].isoformat(),
            }
            for m in result["messages"]
        ],
    }


@router.delete("/{session_id}", status_code=204)
async def delete_session(session_id: uuid.UUID, user: User = Depends(current_user)):
    deleted = await db.delete_session(session_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404)
