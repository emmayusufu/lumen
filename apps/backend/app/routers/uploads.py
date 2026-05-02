import os
import uuid
from typing import Literal

import boto3
from botocore.client import Config
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from app.db import workspaces as workspaces_db
from app.middleware.auth import current_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/uploads")


ALLOWED_MIME: dict[str, str] = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
}
MAX_BYTES = 10 * 1024 * 1024
SERVE_PATH = "/api/v1/uploads/serve"


class PresignRequest(BaseModel):
    content_type: str
    kind: Literal["image"] = "image"


def _client():
    endpoint = os.environ.get("MINIO_PUBLIC_ENDPOINT") or os.environ["MINIO_ENDPOINT"]
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=os.environ["MINIO_ACCESS_KEY"],
        aws_secret_access_key=os.environ["MINIO_SECRET_KEY"],
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


async def _user_can_access_key(user_id: str, key: str) -> bool:
    parts = key.split("/", 2)
    if len(parts) != 3:
        return False
    ws_or_user = parts[0]
    if ws_or_user == user_id:
        return True
    try:
        ws_uuid = uuid.UUID(ws_or_user)
    except ValueError:
        return False
    role = await workspaces_db.get_member_role(ws_uuid, user_id)
    return role is not None


@router.post("/presign")
async def presign(body: PresignRequest, user: User = Depends(current_user)):
    ext = ALLOWED_MIME.get(body.content_type)
    if not ext:
        raise HTTPException(
            status_code=422, detail=f"Unsupported content type: {body.content_type}"
        )

    bucket = os.environ["MINIO_BUCKET"]
    workspaces = await workspaces_db.list_workspaces_for_user(user.id)
    ws_prefix = str(workspaces[0]["id"]) if workspaces else user.id
    key = f"{ws_prefix}/{body.kind}/{uuid.uuid4().hex}.{ext}"

    client = _client()
    put_url = client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": bucket,
            "Key": key,
            "ContentType": body.content_type,
        },
        ExpiresIn=300,
    )

    return {
        "put_url": put_url,
        "public_url": f"/api/backend{SERVE_PATH}/{key}",
        "key": key,
        "max_bytes": MAX_BYTES,
    }


@router.get("/serve/{key:path}")
async def serve(key: str, user: User = Depends(current_user)):
    if not await _user_can_access_key(user.id, key):
        raise HTTPException(status_code=404, detail="Not found")
    bucket = os.environ["MINIO_BUCKET"]
    client = _client()
    signed = client.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=3600,
    )
    return RedirectResponse(signed, status_code=302)
