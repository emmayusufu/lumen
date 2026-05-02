import pytest
from fastapi import HTTPException

from app.middleware.opa import authorize_workspace


async def test_admin_can_invite(db_clean):
    await authorize_workspace("admin", "invite")


async def test_editor_cannot_invite(db_clean):
    with pytest.raises(HTTPException) as exc:
        await authorize_workspace("editor", "invite")
    assert exc.value.status_code == 403


async def test_viewer_can_read_workspace(db_clean):
    await authorize_workspace("viewer", "read_workspace")


async def test_none_role_rejected(db_clean):
    with pytest.raises(HTTPException) as exc:
        await authorize_workspace(None, "invite")
    assert exc.value.status_code == 403
