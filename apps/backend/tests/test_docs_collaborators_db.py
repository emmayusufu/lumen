from unittest.mock import AsyncMock, MagicMock

from app.db import docs


def _acquire_ctx(conn):
    ctx = MagicMock()
    ctx.__aenter__ = AsyncMock(return_value=conn)
    ctx.__aexit__ = AsyncMock(return_value=None)
    return ctx


async def test_list_collaborators_for_owner_returns_aggregated(monkeypatch):
    rows = [
        {
            "user_id": "u2",
            "email": "alice@example.com",
            "display_name": "Alice",
            "doc_count": 2,
            "roles": ["editor", "viewer"],
            "docs": [
                {"doc_id": "d1", "doc_title": "Doc 1", "role": "editor"},
                {"doc_id": "d2", "doc_title": "Doc 2", "role": "viewer"},
            ],
        }
    ]
    conn = MagicMock()
    conn.fetch = AsyncMock(return_value=rows)
    monkeypatch.setattr("app.db.docs.Acquire", lambda: _acquire_ctx(conn))
    result = await docs.list_collaborators_for_owner("u1")
    assert len(result) == 1
    assert result[0]["email"] == "alice@example.com"
    assert result[0]["doc_count"] == 2


async def test_bulk_remove_collaborator_returns_count(monkeypatch):
    conn = MagicMock()
    conn.execute = AsyncMock(return_value="DELETE 3")
    monkeypatch.setattr("app.db.docs.Acquire", lambda: _acquire_ctx(conn))
    count = await docs.bulk_remove_collaborator("u1", "u2")
    assert count == 3


async def test_bulk_remove_collaborator_zero_count(monkeypatch):
    conn = MagicMock()
    conn.execute = AsyncMock(return_value="DELETE 0")
    monkeypatch.setattr("app.db.docs.Acquire", lambda: _acquire_ctx(conn))
    count = await docs.bulk_remove_collaborator("u1", "u2")
    assert count == 0
