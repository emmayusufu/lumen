from unittest.mock import AsyncMock, patch

import bcrypt
from fastapi.testclient import TestClient

from app.main import app
from app.middleware.auth import current_user as real_current_user
from app.models.user import User


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(4)).decode()


def test_signup_creates_user_and_sets_cookie():
    with patch(
        "app.routers.auth.db.create_org_and_user",
        new_callable=AsyncMock,
        return_value=("org1", "user1"),
    ):
        resp = TestClient(app).post(
            "/api/v1/auth/signup",
            json={
                "orgName": "Acme",
                "firstName": "Alice",
                "lastName": "Smith",
                "email": "alice@acme.com",
                "password": "password123",
            },
        )
    assert resp.status_code == 201
    assert resp.json()["email"] == "alice@acme.com"
    assert resp.json()["name"] == "Alice Smith"
    assert "token" in resp.cookies


def test_signup_duplicate_email_returns_400():
    from asyncpg import UniqueViolationError

    with patch(
        "app.routers.auth.db.create_org_and_user",
        new_callable=AsyncMock,
        side_effect=UniqueViolationError("duplicate"),
    ):
        resp = TestClient(app).post(
            "/api/v1/auth/signup",
            json={
                "orgName": "Acme",
                "firstName": "Alice",
                "lastName": "Smith",
                "email": "alice@acme.com",
                "password": "password123",
            },
        )
    assert resp.status_code == 400


def test_login_valid_credentials_sets_cookie():
    user_data = {
        "id": "user1",
        "email": "alice@acme.com",
        "name": "Alice Smith",
        "org_id": "org1",
        "password_hash": _hash("password123"),
    }
    with patch("app.routers.auth.db.get_user_for_auth", new_callable=AsyncMock, return_value=user_data):
        resp = TestClient(app).post(
            "/api/v1/auth/login",
            json={"email": "alice@acme.com", "password": "password123"},
        )
    assert resp.status_code == 200
    assert resp.json()["email"] == "alice@acme.com"
    assert "token" in resp.cookies


def test_login_user_not_found_returns_401():
    with patch("app.routers.auth.db.get_user_for_auth", new_callable=AsyncMock, return_value=None):
        resp = TestClient(app, raise_server_exceptions=False).post(
            "/api/v1/auth/login",
            json={"email": "nobody@acme.com", "password": "password123"},
        )
    assert resp.status_code == 401


def test_login_wrong_password_returns_401():
    user_data = {
        "id": "user1",
        "email": "alice@acme.com",
        "name": "Alice Smith",
        "org_id": "org1",
        "password_hash": _hash("correct-password"),
    }
    with patch("app.routers.auth.db.get_user_for_auth", new_callable=AsyncMock, return_value=user_data):
        resp = TestClient(app, raise_server_exceptions=False).post(
            "/api/v1/auth/login",
            json={"email": "alice@acme.com", "password": "wrong-password"},
        )
    assert resp.status_code == 401


def test_me_returns_current_user():
    app.dependency_overrides[real_current_user] = lambda: User(
        id="user1", org_id="org1", email="alice@acme.com", name="Alice Smith"
    )
    try:
        resp = TestClient(app).get("/api/v1/auth/me")
    finally:
        app.dependency_overrides.pop(real_current_user, None)
    assert resp.status_code == 200
    data = resp.json()
    assert data == {"id": "user1", "email": "alice@acme.com", "name": "Alice Smith", "org_id": "org1"}


def test_logout_without_cookie_returns_204():
    resp = TestClient(app).post("/api/v1/auth/logout")
    assert resp.status_code == 204


def test_logout_with_cookie_revokes_and_clears():
    from app.utils.token import create_token

    token = create_token("user1", "alice@acme.com", "org1", "Alice Smith")
    with (
        patch("app.middleware.auth._is_revoked", new_callable=AsyncMock, return_value=False),
        patch("app.routers.auth._revoke", new_callable=AsyncMock),
    ):
        resp = TestClient(app).post("/api/v1/auth/logout", cookies={"token": token})
    assert resp.status_code == 204
