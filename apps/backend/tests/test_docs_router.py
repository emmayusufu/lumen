import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.middleware.auth import current_user as real_current_user
from app.models.user import User


def make_user():
    return User(id="user123", org_id="org1", email="t@t.com")


def test_list_docs_requires_auth():
    client = TestClient(app, raise_server_exceptions=False)
    assert client.get("/api/content/docs").status_code == 401


def test_list_docs_returns_docs():
    ts = datetime(2026, 4, 7, tzinfo=UTC)
    rows = [
        {
            "id": uuid.uuid4(),
            "title": "My Doc",
            "updated_at": ts,
            "owner_id": "user123",
            "role": "owner",
        }
    ]

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch("app.routers.docs.db.list_docs", new_callable=AsyncMock, return_value=rows):
            response = TestClient(app).get("/api/content/docs")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "My Doc"
    assert data[0]["role"] == "owner"


def test_create_doc_returns_id():
    new_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch("app.routers.docs.db.create_doc", new_callable=AsyncMock, return_value=new_id):
            response = TestClient(app).post("/api/content/docs", json={"title": "Test"})
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 201
    assert response.json()["id"] == str(new_id)


def test_get_doc_returns_403_for_non_member():
    doc_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value=None):
            response = TestClient(app).get(f"/api/content/docs/{doc_id}")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 403


def test_get_doc_returns_content():
    doc_id = uuid.uuid4()
    ts = datetime(2026, 4, 7, tzinfo=UTC)
    doc_data = {
        "id": doc_id,
        "owner_id": "user123",
        "title": "Test",
        "content": "# Hello",
        "created_at": ts,
        "updated_at": ts,
    }

    app.dependency_overrides[real_current_user] = make_user
    try:
        with (
            patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value="owner"),
            patch("app.routers.docs.db.get_doc", new_callable=AsyncMock, return_value=doc_data),
            patch(
                "app.routers.docs.db.list_collaborators", new_callable=AsyncMock, return_value=[]
            ),
        ):
            response = TestClient(app).get(f"/api/content/docs/{doc_id}")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "# Hello"
    assert data["role"] == "owner"


def test_patch_doc_forbidden_for_viewer():
    doc_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value="viewer"):
            response = TestClient(app).patch(f"/api/content/docs/{doc_id}", json={"content": "new"})
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 403


def test_delete_doc_forbidden_for_editor():
    doc_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value="editor"):
            response = TestClient(app).delete(f"/api/content/docs/{doc_id}")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 403


def test_delete_doc_returns_204_for_owner():
    doc_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with (
            patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value="owner"),
            patch("app.routers.docs.db.delete_doc", new_callable=AsyncMock, return_value=True),
        ):
            response = TestClient(app).delete(f"/api/content/docs/{doc_id}")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 204


def test_add_collaborator_user_not_found():
    doc_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with (
            patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value="owner"),
            patch(
                "app.routers.docs.users_db.get_user_by_email",
                new_callable=AsyncMock,
                return_value=None,
            ),
        ):
            response = TestClient(app).post(
                f"/api/content/docs/{doc_id}/collaborators",
                json={"email": "nobody@test.com", "role": "editor"},
            )
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 404


def test_add_collaborator_succeeds():
    doc_id = uuid.uuid4()
    target_user = {
        "zitadel_user_id": "other-user",
        "display_name": "Other",
        "email": "other@test.com",
    }

    app.dependency_overrides[real_current_user] = make_user
    try:
        with (
            patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value="owner"),
            patch(
                "app.routers.docs.users_db.get_user_by_email",
                new_callable=AsyncMock,
                return_value=target_user,
            ),
            patch("app.routers.docs.db.add_collaborator", new_callable=AsyncMock),
        ):
            response = TestClient(app).post(
                f"/api/content/docs/{doc_id}/collaborators",
                json={"email": "other@test.com", "role": "editor"},
            )
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 201


def test_add_collaborator_owner_cannot_add_self():
    doc_id = uuid.uuid4()
    self_user = {"zitadel_user_id": "user123", "display_name": "Self", "email": "t@t.com"}

    app.dependency_overrides[real_current_user] = make_user
    try:
        with (
            patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value="owner"),
            patch(
                "app.routers.docs.users_db.get_user_by_email",
                new_callable=AsyncMock,
                return_value=self_user,
            ),
        ):
            response = TestClient(app).post(
                f"/api/content/docs/{doc_id}/collaborators",
                json={"email": "t@t.com", "role": "editor"},
            )
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 422


def test_add_collaborator_invalid_role_returns_422():
    doc_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value="owner"):
            response = TestClient(app).post(
                f"/api/content/docs/{doc_id}/collaborators",
                json={"email": "other@test.com", "role": "admin"},
            )
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 422


def test_remove_collaborator_forbidden_for_non_owner():
    doc_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value="editor"):
            response = TestClient(app).delete(f"/api/content/docs/{doc_id}/collaborators/some-user")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 403


def test_search_users_returns_empty_when_not_found():
    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch(
            "app.routers.users.db.get_user_by_email", new_callable=AsyncMock, return_value=None
        ):
            response = TestClient(app).get("/api/users/search?email=nobody@test.com")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 200
    assert response.json() == []
