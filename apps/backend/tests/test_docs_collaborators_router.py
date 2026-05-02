from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.middleware.auth import current_user
from app.models.user import User


def _user():
    return User(id="u1", email="a@b.com", name="A")


def test_list_my_collaborators():
    app.dependency_overrides[current_user] = _user
    try:
        rows = [
            {
                "user_id": "u2",
                "email": "alice@example.com",
                "display_name": "Alice",
                "doc_count": 2,
                "roles": ["editor", "viewer"],
                "docs": [{"doc_id": "d1", "doc_title": "Doc 1", "role": "editor"}],
            }
        ]
        with patch(
            "app.routers.docs.db.list_collaborators_for_owner",
            new_callable=AsyncMock,
            return_value=rows,
        ):
            resp = TestClient(app).get("/api/v1/content/collaborators/my")
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["email"] == "alice@example.com"


def test_bulk_remove_collaborator():
    app.dependency_overrides[current_user] = _user
    try:
        with patch(
            "app.routers.docs.db.bulk_remove_collaborator",
            new_callable=AsyncMock,
            return_value=3,
        ) as m:
            resp = TestClient(app).delete("/api/v1/content/collaborators/u2")
    finally:
        app.dependency_overrides.pop(current_user, None)
    assert resp.status_code == 200
    assert resp.json() == {"removed_count": 3}
    m.assert_awaited_once_with("u1", "u2")


def test_bulk_remove_requires_auth():
    resp = TestClient(app, raise_server_exceptions=False).delete("/api/v1/content/collaborators/u2")
    assert resp.status_code == 401
