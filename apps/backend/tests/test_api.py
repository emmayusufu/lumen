from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_research_endpoint_requires_auth():
    client = TestClient(app, raise_server_exceptions=False)
    response = client.post(
        "/api/research",
        json={"query": "test query", "output_mode": "chat"},
    )
    assert response.status_code == 401
