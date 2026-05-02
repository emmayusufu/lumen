import uuid
from datetime import UTC
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.db import credentials as creds
from app.services.crypto import encrypt as real_encrypt


@pytest.mark.asyncio
async def test_get_user_key_returns_none_when_absent():
    mock_pool = MagicMock()
    mock_pool.return_value.fetchrow = AsyncMock(return_value=None)
    with patch("app.db.credentials.pool", mock_pool):
        result = await creds.get_user_key("user1")
    assert result is None


@pytest.mark.asyncio
async def test_get_user_key_returns_decrypted_value():
    enc_value = real_encrypt("sk-abc")
    mock_pool = MagicMock()
    mock_pool.return_value.fetchrow = AsyncMock(return_value={"deepseek_key_enc": enc_value})
    with patch("app.db.credentials.pool", mock_pool):
        result = await creds.get_user_key("user1")
    assert result == "sk-abc"


@pytest.mark.asyncio
async def test_get_user_info_returns_configured_false_when_absent():
    mock_pool = MagicMock()
    mock_pool.return_value.fetchrow = AsyncMock(return_value=None)
    with patch("app.db.credentials.pool", mock_pool):
        info = await creds.get_user_key_info("user1")
    assert info["configured"] is False
    assert info["last_four"] is None
    assert info["updated_at"] is None


@pytest.mark.asyncio
async def test_get_user_info_returns_last_four_and_updated_at():
    from datetime import datetime

    enc_value = real_encrypt("sk-0123456789abcd")
    ts = datetime(2026, 4, 15, tzinfo=UTC)
    mock_pool = MagicMock()
    mock_pool.return_value.fetchrow = AsyncMock(
        return_value={"deepseek_key_enc": enc_value, "updated_at": ts}
    )
    with patch("app.db.credentials.pool", mock_pool):
        info = await creds.get_user_key_info("user1")
    assert info["configured"] is True
    assert info["last_four"] == "abcd"
    assert info["updated_at"] == ts.isoformat()


@pytest.mark.asyncio
async def test_set_user_key_upserts_encrypted_value():
    captured = {}

    async def fake_execute(*args, **kwargs):
        captured["sql"] = args[0]
        captured["params"] = args[1:]

    mock_pool = MagicMock()
    mock_pool.return_value.execute = fake_execute
    with patch("app.db.credentials.pool", mock_pool):
        await creds.set_user_key("user1", "sk-xyz")
    assert captured["params"][0] == "user1"
    assert "ON CONFLICT" in captured["sql"]
    assert captured["params"][1] != "sk-xyz"


@pytest.mark.asyncio
async def test_delete_user_key_executes_delete():
    captured = {}

    async def fake_execute(*args):
        captured["sql"] = args[0]
        captured["args"] = args[1:]

    mock_pool = MagicMock()
    mock_pool.return_value.execute = fake_execute
    with patch("app.db.credentials.pool", mock_pool):
        await creds.delete_user_key("user1")
    assert "DELETE" in captured["sql"].upper()
    assert captured["args"] == ("user1",)


@pytest.mark.asyncio
async def test_get_workspace_key_returns_decrypted_value():
    enc_value = real_encrypt("sk-org")
    ws_id = uuid.uuid4()
    mock_pool = MagicMock()
    mock_pool.return_value.fetchrow = AsyncMock(return_value={"deepseek_key_enc": enc_value})
    with patch("app.db.credentials.pool", mock_pool):
        result = await creds.get_workspace_key(ws_id)
    assert result == "sk-org"


@pytest.mark.asyncio
async def test_set_workspace_key_upserts_encrypted():
    captured = {}
    ws_id = uuid.uuid4()

    async def fake_execute(*args):
        captured["sql"] = args[0]
        captured["args"] = args[1:]

    mock_pool = MagicMock()
    mock_pool.return_value.execute = fake_execute
    with patch("app.db.credentials.pool", mock_pool):
        await creds.set_workspace_key(ws_id, "sk-org")
    assert "ON CONFLICT" in captured["sql"]
    assert captured["args"][0] == ws_id
    assert captured["args"][1] != "sk-org"
