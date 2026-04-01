from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app


def test_research_without_user_headers_returns_401():
    client = TestClient(app, raise_server_exceptions=False)
    resp = client.post("/api/research", json={"query": "test", "output_mode": "chat"})
    assert resp.status_code == 401


def test_research_with_user_headers_passes_auth():
    with patch("app.middleware.auth._upsert_profile", new_callable=AsyncMock):
        client = TestClient(app, raise_server_exceptions=False)
        resp = client.post(
            "/api/research",
            json={"query": "test", "output_mode": "chat"},
            headers={
                "X-User-Id": "user123",
                "X-User-Org": "org456",
                "X-User-Email": "test@example.com",
            },
        )
    assert resp.status_code == 200


def test_health_still_public():
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
