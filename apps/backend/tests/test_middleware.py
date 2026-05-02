from unittest.mock import AsyncMock, patch

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.middleware.auth import attach_user, current_user
from app.models.user import User
from app.utils.token import create_token

mini_app = FastAPI()
mini_app.middleware("http")(attach_user)


@mini_app.get("/protected")
def protected(user: User = Depends(current_user)):
    return {"id": user.id, "email": user.email, "name": user.name}


def test_no_token_returns_401():
    resp = TestClient(mini_app, raise_server_exceptions=False).get("/protected")
    assert resp.status_code == 401


def test_valid_cookie_authenticates_user():
    token = create_token("u1", "a@a.com", "Alice")
    with patch("app.middleware.auth._is_revoked", new_callable=AsyncMock, return_value=False):
        resp = TestClient(mini_app).get("/protected", cookies={"token": token})
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "u1"
    assert data["email"] == "a@a.com"
    assert data["name"] == "Alice"


def test_bearer_token_authenticates_user():
    token = create_token("u2", "b@b.com", "Bob")
    with patch("app.middleware.auth._is_revoked", new_callable=AsyncMock, return_value=False):
        resp = TestClient(mini_app).get("/protected", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["id"] == "u2"


def test_revoked_token_returns_401():
    token = create_token("u1", "a@a.com", "Alice")
    with patch("app.middleware.auth._is_revoked", new_callable=AsyncMock, return_value=True):
        resp = TestClient(mini_app, raise_server_exceptions=False).get(
            "/protected", cookies={"token": token}
        )
    assert resp.status_code == 401


def test_invalid_token_returns_401():
    with patch("app.middleware.auth._is_revoked", new_callable=AsyncMock, return_value=False):
        resp = TestClient(mini_app, raise_server_exceptions=False).get(
            "/protected", cookies={"token": "not.a.jwt"}
        )
    assert resp.status_code == 401
