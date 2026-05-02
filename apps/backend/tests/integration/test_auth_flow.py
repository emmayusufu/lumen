import httpx
import pytest


@pytest.mark.integration
async def test_signup_creates_user_and_sets_cookie(client: httpx.AsyncClient):
    resp = await client.post(
        "/api/v1/auth/signup",
        json={
            "workspaceName": "Acme",
            "firstName": "Alice",
            "lastName": "Smith",
            "email": "alice@acme.test",
            "password": "password123",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "alice@acme.test"
    assert body["name"] == "Alice Smith"
    assert "token" in resp.cookies


@pytest.mark.integration
async def test_signup_duplicate_email_returns_400(client: httpx.AsyncClient):
    payload = {
        "workspaceName": "Acme",
        "firstName": "Alice",
        "lastName": "Smith",
        "email": "alice@acme.test",
        "password": "password123",
    }
    assert (await client.post("/api/v1/auth/signup", json=payload)).status_code == 201
    resp = await client.post("/api/v1/auth/signup", json=payload)
    assert resp.status_code == 400


@pytest.mark.integration
async def test_login_roundtrip(client: httpx.AsyncClient, signed_up_user: dict):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": signed_up_user["email"], "password": signed_up_user["password"]},
    )
    assert resp.status_code == 200
    assert resp.json()["id"] == signed_up_user["id"]
    assert "token" in resp.cookies


@pytest.mark.integration
async def test_login_wrong_password_returns_401(client: httpx.AsyncClient, signed_up_user: dict):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": signed_up_user["email"], "password": "wrong-password"},
    )
    assert resp.status_code == 401


@pytest.mark.integration
async def test_me_returns_current_user(client: httpx.AsyncClient, signed_up_user: dict):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 200
    assert resp.json()["id"] == signed_up_user["id"]
    assert resp.json()["email"] == signed_up_user["email"]
    assert resp.json()["is_admin"] is True


@pytest.mark.integration
async def test_me_unauthenticated_returns_401(client: httpx.AsyncClient):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401
