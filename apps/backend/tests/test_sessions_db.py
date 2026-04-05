import uuid
from unittest.mock import AsyncMock, patch

import pytest

from app.db.sessions import (
    create_session,
    delete_session,
    get_session,
    list_sessions,
    save_message,
)


def make_acquire(mock_conn):
    cm = AsyncMock()
    cm.__aenter__ = AsyncMock(return_value=mock_conn)
    cm.__aexit__ = AsyncMock(return_value=False)
    return cm


@pytest.mark.asyncio
async def test_create_session_returns_uuid():
    session_id = uuid.uuid4()
    mock_conn = AsyncMock()
    mock_conn.fetchrow.return_value = {"id": session_id}

    with patch("app.db.sessions.Acquire", return_value=make_acquire(mock_conn)):
        result = await create_session("user123", "Test title")

    assert result == session_id


@pytest.mark.asyncio
async def test_save_message_executes_insert():
    mock_conn = AsyncMock()

    with patch("app.db.sessions.Acquire", return_value=make_acquire(mock_conn)):
        await save_message(uuid.uuid4(), "user", "hello")

    mock_conn.execute.assert_called_once()


@pytest.mark.asyncio
async def test_list_sessions_returns_rows():
    session_id = uuid.uuid4()
    mock_conn = AsyncMock()
    mock_conn.fetch.return_value = [
        {"id": session_id, "title": "Test", "updated_at": "2026-04-07T00:00:00+00:00"}
    ]

    with patch("app.db.sessions.Acquire", return_value=make_acquire(mock_conn)):
        result = await list_sessions("user123")

    assert len(result) == 1
    assert result[0]["id"] == session_id


@pytest.mark.asyncio
async def test_get_session_returns_none_when_missing():
    mock_conn = AsyncMock()
    mock_conn.fetchrow.return_value = None

    with patch("app.db.sessions.Acquire", return_value=make_acquire(mock_conn)):
        result = await get_session(uuid.uuid4(), "user123")

    assert result is None


@pytest.mark.asyncio
async def test_delete_session_returns_true_on_success():
    mock_conn = AsyncMock()
    mock_conn.execute.return_value = "DELETE 1"

    with patch("app.db.sessions.Acquire", return_value=make_acquire(mock_conn)):
        result = await delete_session(uuid.uuid4(), "user123")

    assert result is True


@pytest.mark.asyncio
async def test_delete_session_returns_false_when_not_found():
    mock_conn = AsyncMock()
    mock_conn.execute.return_value = "DELETE 0"

    with patch("app.db.sessions.Acquire", return_value=make_acquire(mock_conn)):
        result = await delete_session(uuid.uuid4(), "user123")

    assert result is False
