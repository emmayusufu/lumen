from fastapi import APIRouter, Depends

from app.db import users as db
from app.middleware.auth import current_user
from app.models.user import User

router = APIRouter(prefix="/api/users")


@router.get("/search")
async def search_users(email: str, user: User = Depends(current_user)):
    result = await db.get_user_by_email(email)
    if not result:
        return []
    return [
        {
            "user_id": result["zitadel_user_id"],
            "display_name": result["display_name"],
            "email": result["email"],
        }
    ]
