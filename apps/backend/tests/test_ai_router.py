from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.middleware.auth import current_user as real_current_user
from app.models.user import User


def _make_user():
    return User(id="user123", org_id="org1", email="t@t.com")


def _fake_llm():
    llm = MagicMock()

    async def fake_astream(_messages):
        yield MagicMock(content="improved ")
        yield MagicMock(content="version")

    llm.astream = fake_astream
    llm.ainvoke = AsyncMock(return_value=MagicMock(content='{"ok": true, "issues": []}'))
    return llm


def test_inline_endpoint_requires_auth():
    client = TestClient(app, raise_server_exceptions=False)
    assert client.post("/api/v1/ai/inline", json={"action": "improve"}).status_code == 401


def test_inline_endpoint_streams_sse_events():
    app.dependency_overrides[real_current_user] = _make_user
    try:
        with patch("app.routers.ai.get_inline_llm", return_value=_fake_llm()):
            response = TestClient(app).post(
                "/api/v1/ai/inline",
                json={"action": "improve", "selection": "original text", "context": ""},
            )
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 200
    body = response.text
    assert "event: status" in body
    assert "event: token" in body
    assert "event: draft_complete" in body
    assert "event: done" in body


def test_inline_endpoint_rejects_unknown_action():
    app.dependency_overrides[real_current_user] = _make_user
    try:
        response = TestClient(app).post(
            "/api/v1/ai/inline",
            json={"action": "nonsense", "selection": "x"},
        )
    finally:
        app.dependency_overrides.pop(real_current_user, None)
    assert response.status_code == 422


def test_inline_endpoint_handles_grammar_without_editor():
    app.dependency_overrides[real_current_user] = _make_user
    try:
        with patch("app.routers.ai.get_inline_llm", return_value=_fake_llm()):
            response = TestClient(app).post(
                "/api/v1/ai/inline",
                json={"action": "grammar", "selection": "origianl text"},
            )
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 200
    body = response.text
    assert "event: token" in body
    assert "event: done" in body
