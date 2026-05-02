import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app
from app.middleware.auth import current_user as real_current_user
from app.models.user import User


def make_user():
    return User(id="user123", email="t@t.com")


def _opa_stub(allow: bool):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"result": allow}
    mock_client = AsyncMock()
    mock_client.post.return_value = mock_resp
    return mock_client


def _opa_allow():
    return _opa_stub(True)


def _opa_deny():
    return _opa_stub(False)


def test_list_docs_requires_auth():
    client = TestClient(app, raise_server_exceptions=False)
    assert client.get("/api/v1/content/docs").status_code == 401


def test_list_docs_returns_docs():
    ts = datetime(2026, 4, 7, tzinfo=UTC)
    rows = [
        {
            "id": uuid.uuid4(),
            "title": "My Doc",
            "updated_at": ts,
            "owner_id": "user123",
            "workspace_slug": "acme-ab12",
            "role": "owner",
        }
    ]

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch("app.routers.docs.db.list_docs", new_callable=AsyncMock, return_value=rows):
            response = TestClient(app).get("/api/v1/content/docs")
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
        with (
            patch(
                "app.routers.docs.workspaces_db.list_workspaces_for_user",
                new_callable=AsyncMock,
                return_value=[{"id": uuid.uuid4()}],
            ),
            patch("app.routers.docs.db.create_doc", new_callable=AsyncMock, return_value=new_id),
        ):
            response = TestClient(app).post("/api/v1/content/docs", json={"title": "Test"})
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 201
    assert response.json()["id"] == str(new_id)


def test_get_doc_returns_403_for_non_member():
    doc_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value=None):
            response = TestClient(app).get(f"/api/v1/content/docs/{doc_id}")
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 403


def test_get_doc_returns_content():
    doc_id = uuid.uuid4()
    ts = datetime(2026, 4, 7, tzinfo=UTC)
    doc_data = {
        "id": doc_id,
        "owner_id": "user123",
        "workspace_id": uuid.uuid4(),
        "workspace_slug": "acme-ab12",
        "title": "Test",
        "content": "# Hello",
        "visibility": "private",
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
            patch("app.middleware.opa.opa_client", return_value=_opa_allow()),
        ):
            response = TestClient(app).get(f"/api/v1/content/docs/{doc_id}")
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
        with (
            patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value="viewer"),
            patch("app.middleware.opa.opa_client", return_value=_opa_deny()),
        ):
            response = TestClient(app).patch(
                f"/api/v1/content/docs/{doc_id}", json={"content": "new"}
            )
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 403


def test_delete_doc_forbidden_for_editor():
    doc_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with (
            patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value="editor"),
            patch("app.middleware.opa.opa_client", return_value=_opa_deny()),
        ):
            response = TestClient(app).delete(f"/api/v1/content/docs/{doc_id}")
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
            patch("app.middleware.opa.opa_client", return_value=_opa_allow()),
        ):
            response = TestClient(app).delete(f"/api/v1/content/docs/{doc_id}")
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
            patch("app.middleware.opa.opa_client", return_value=_opa_allow()),
        ):
            response = TestClient(app).post(
                f"/api/v1/content/docs/{doc_id}/collaborators",
                json={"email": "nobody@test.com", "role": "editor"},
            )
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 404


def test_add_collaborator_succeeds():
    doc_id = uuid.uuid4()
    target_user = {"id": "other-user", "name": "Other", "email": "other@test.com"}

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
            patch("app.middleware.opa.opa_client", return_value=_opa_allow()),
        ):
            response = TestClient(app).post(
                f"/api/v1/content/docs/{doc_id}/collaborators",
                json={"email": "other@test.com", "role": "editor"},
            )
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 201


def test_add_collaborator_owner_cannot_add_self():
    doc_id = uuid.uuid4()
    self_user = {"id": "user123", "name": "Self", "email": "t@t.com"}

    app.dependency_overrides[real_current_user] = make_user
    try:
        with (
            patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value="owner"),
            patch(
                "app.routers.docs.users_db.get_user_by_email",
                new_callable=AsyncMock,
                return_value=self_user,
            ),
            patch("app.middleware.opa.opa_client", return_value=_opa_allow()),
        ):
            response = TestClient(app).post(
                f"/api/v1/content/docs/{doc_id}/collaborators",
                json={"email": "t@t.com", "role": "editor"},
            )
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 422


def test_add_collaborator_invalid_role_returns_422():
    doc_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with (
            patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value="owner"),
            patch("app.middleware.opa.opa_client", return_value=_opa_allow()),
        ):
            response = TestClient(app).post(
                f"/api/v1/content/docs/{doc_id}/collaborators",
                json={"email": "other@test.com", "role": "admin"},
            )
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 422


def test_remove_collaborator_forbidden_for_non_owner():
    doc_id = uuid.uuid4()

    app.dependency_overrides[real_current_user] = make_user
    try:
        with (
            patch("app.routers.docs.db.get_role", new_callable=AsyncMock, return_value="editor"),
            patch("app.middleware.opa.opa_client", return_value=_opa_deny()),
        ):
            response = TestClient(app).delete(
                f"/api/v1/content/docs/{doc_id}/collaborators/some-user"
            )
    finally:
        app.dependency_overrides.pop(real_current_user, None)

    assert response.status_code == 403
