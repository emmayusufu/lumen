import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.middleware.auth import current_user as real_current_user
from app.models.user import User


def make_user():
    return User(id="user123", org_id="org1", email="t@t.com")


def test_list_sessions_requires_auth():
    client = TestClient(app, raise_server_exceptions=False)
    assert client.get("/api/sessions").status_code == 401


def test_list_sessions_returns_sessions():
    session_id = uuid.uuid4()
    rows = [
        {"id": session_id, "title": "Test query", "updated_at": datetime(2026, 4, 7, tzinfo=UTC)}
    ]

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch(
            "app.routers.sessions.db.list_sessions", new_callable=AsyncMock, return_value=rows
        ):
            response = TestClient(app).get("/api/sessions")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Test query"
    assert data[0]["id"] == str(session_id)


def test_get_session_returns_404_when_missing():
    session_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch(
            "app.routers.sessions.db.get_session", new_callable=AsyncMock, return_value=None
        ):
            response = TestClient(app).get(f"/api/sessions/{session_id}")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 404


def test_get_session_returns_session_with_messages():
    session_id = uuid.uuid4()
    ts = datetime(2026, 4, 7, tzinfo=UTC)
    session_data = {
        "id": session_id,
        "title": "Test",
        "updated_at": ts,
        "messages": [{"role": "user", "content": "hello", "created_at": ts}],
    }

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch(
            "app.routers.sessions.db.get_session", new_callable=AsyncMock, return_value=session_data
        ):
            response = TestClient(app).get(f"/api/sessions/{session_id}")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test"
    assert len(data["messages"]) == 1
    assert data["messages"][0]["role"] == "user"


def test_delete_session_returns_204():
    session_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch(
            "app.routers.sessions.db.delete_session", new_callable=AsyncMock, return_value=True
        ):
            response = TestClient(app).delete(f"/api/sessions/{session_id}")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 204


def test_delete_session_returns_404_when_missing():
    session_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch(
            "app.routers.sessions.db.delete_session", new_callable=AsyncMock, return_value=False
        ):
            response = TestClient(app).delete(f"/api/sessions/{session_id}")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 404
