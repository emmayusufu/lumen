from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.middleware.auth import current_user
from app.models.user import User


def _user():
    return User(id="u1", email="a@b.com", name="Alice", is_admin=False)


def test_get_profile():
    app.dependency_overrides[current_user] = _user
    try:
        resp = TestClient(app).get("/api/v1/settings/profile")
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 200
    data = resp.json()
    assert data == {
        "id": "u1",
        "email": "a@b.com",
        "name": "Alice",
        "is_admin": False,
    }


def test_patch_profile_name_only():
    app.dependency_overrides[current_user] = _user
    try:
        with patch("app.routers.settings.users_db.update_profile", new_callable=AsyncMock) as m:
            resp = TestClient(app).patch(
                "/api/v1/settings/profile",
                json={"name": "Alice New"},
            )
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 200
    m.assert_awaited_once_with("u1", "Alice New", None)


def test_patch_profile_email_requires_password():
    app.dependency_overrides[current_user] = _user
    try:
        resp = TestClient(app).patch(
            "/api/v1/settings/profile",
            json={"email": "new@example.com"},
        )
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 400
    assert "password" in resp.json()["detail"].lower()


def test_patch_profile_email_wrong_password():
    app.dependency_overrides[current_user] = _user
    try:
        with patch(
            "app.routers.settings.users_db.verify_password",
            new_callable=AsyncMock,
            return_value=False,
        ):
            resp = TestClient(app).patch(
                "/api/v1/settings/profile",
                json={"email": "new@example.com", "current_password": "bad"},
            )
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 400


def test_patch_profile_email_duplicate():
    app.dependency_overrides[current_user] = _user
    try:
        with (
            patch(
                "app.routers.settings.users_db.verify_password",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch(
                "app.routers.settings.users_db.email_exists_for_other_user",
                new_callable=AsyncMock,
                return_value=True,
            ),
        ):
            resp = TestClient(app).patch(
                "/api/v1/settings/profile",
                json={"email": "dup@example.com", "current_password": "secret"},
            )
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 400
    assert "in use" in resp.json()["detail"].lower()


def test_patch_profile_email_with_password():
    app.dependency_overrides[current_user] = _user
    try:
        with (
            patch(
                "app.routers.settings.users_db.verify_password",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch(
                "app.routers.settings.users_db.email_exists_for_other_user",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch("app.routers.settings.users_db.update_profile", new_callable=AsyncMock),
        ):
            resp = TestClient(app).patch(
                "/api/v1/settings/profile",
                json={"email": "new@example.com", "current_password": "secret"},
            )
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 200


def test_post_password_change():
    app.dependency_overrides[current_user] = _user
    try:
        with (
            patch(
                "app.routers.settings.users_db.verify_password",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch("app.routers.settings.users_db.update_password", new_callable=AsyncMock) as m,
        ):
            resp = TestClient(app).post(
                "/api/v1/settings/password",
                json={"current_password": "old", "new_password": "newpassword123"},
            )
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 200
    m.assert_awaited_once_with("u1", "newpassword123")


def test_post_password_wrong_current():
    app.dependency_overrides[current_user] = _user
    try:
        with patch(
            "app.routers.settings.users_db.verify_password",
            new_callable=AsyncMock,
            return_value=False,
        ):
            resp = TestClient(app).post(
                "/api/v1/settings/password",
                json={"current_password": "wrong", "new_password": "newpassword123"},
            )
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 400
