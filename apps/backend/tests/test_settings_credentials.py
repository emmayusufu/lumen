import uuid
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.middleware.auth import current_user
from app.models.user import User


def _user(is_admin: bool = False):
    def _get():
        return User(id="u1", email="a@b.com", name="A", is_admin=is_admin)

    return _get


_WS_ID = uuid.uuid4()


def _ws_list():
    return [{"id": _WS_ID}]


def test_get_credentials_not_configured():
    app.dependency_overrides[current_user] = _user()
    try:
        empty = {"configured": False, "last_four": None, "updated_at": None}
        with (
            patch(
                "app.routers.settings.creds_db.get_user_key_info",
                new_callable=AsyncMock,
                return_value=empty,
            ),
            patch(
                "app.routers.settings.creds_db.get_workspace_key_info",
                new_callable=AsyncMock,
                return_value=empty,
            ),
            patch(
                "app.routers.settings.creds_db.get_user_serper_key_info",
                new_callable=AsyncMock,
                return_value=empty,
            ),
            patch(
                "app.routers.settings.creds_db.get_workspace_serper_key_info",
                new_callable=AsyncMock,
                return_value=empty,
            ),
            patch(
                "app.routers.settings.workspaces_db.list_workspaces_for_user",
                new_callable=AsyncMock,
                return_value=_ws_list(),
            ),
        ):
            resp = TestClient(app).get("/api/v1/settings/credentials")
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 200
    body = resp.json()
    assert body["user"]["configured"] is False
    assert body["workspace"]["configured"] is False


def test_put_user_credential():
    app.dependency_overrides[current_user] = _user()
    try:
        with patch("app.routers.settings.creds_db.set_user_key", new_callable=AsyncMock) as m:
            resp = TestClient(app).put(
                "/api/v1/settings/credentials/user",
                json={"api_key": "sk-abc123"},
            )
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 200
    m.assert_awaited_once_with("u1", "sk-abc123")


def test_delete_user_credential():
    app.dependency_overrides[current_user] = _user()
    try:
        with patch("app.routers.settings.creds_db.delete_user_key", new_callable=AsyncMock) as m:
            resp = TestClient(app).delete("/api/v1/settings/credentials/user")
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 200
    m.assert_awaited_once_with("u1")


def test_put_workspace_credential_requires_admin():
    app.dependency_overrides[current_user] = _user(is_admin=False)
    try:
        resp = TestClient(app).put(
            "/api/v1/settings/credentials/workspace",
            json={"api_key": "sk-abcd1234"},
        )
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 403


def test_put_workspace_credential_as_admin():
    app.dependency_overrides[current_user] = _user(is_admin=True)
    try:
        with (
            patch(
                "app.routers.settings.workspaces_db.list_workspaces_for_user",
                new_callable=AsyncMock,
                return_value=_ws_list(),
            ),
            patch("app.routers.settings.creds_db.set_workspace_key", new_callable=AsyncMock) as m,
        ):
            resp = TestClient(app).put(
                "/api/v1/settings/credentials/workspace",
                json={"api_key": "sk-org-1234"},
            )
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 200
    m.assert_awaited_once_with(_WS_ID, "sk-org-1234")


def test_delete_workspace_credential_requires_admin():
    app.dependency_overrides[current_user] = _user(is_admin=False)
    try:
        resp = TestClient(app).delete("/api/v1/settings/credentials/workspace")
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 403


def test_delete_workspace_credential_as_admin():
    app.dependency_overrides[current_user] = _user(is_admin=True)
    try:
        with (
            patch(
                "app.routers.settings.workspaces_db.list_workspaces_for_user",
                new_callable=AsyncMock,
                return_value=_ws_list(),
            ),
            patch("app.routers.settings.creds_db.clear_workspace_key", new_callable=AsyncMock) as m,
        ):
            resp = TestClient(app).delete("/api/v1/settings/credentials/workspace")
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 200
    m.assert_awaited_once_with(_WS_ID)
