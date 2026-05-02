from unittest.mock import AsyncMock, MagicMock

import bcrypt

from app.db import users as users_db


def _acquire_ctx(conn):
    ctx = MagicMock()
    ctx.__aenter__ = AsyncMock(return_value=conn)
    ctx.__aexit__ = AsyncMock(return_value=None)
    return ctx


async def test_verify_password_returns_true_for_correct(monkeypatch):
    pw_hash = bcrypt.hashpw(b"secret", bcrypt.gensalt()).decode()
    conn = MagicMock()
    conn.fetchrow = AsyncMock(return_value={"password_hash": pw_hash})
    monkeypatch.setattr("app.db.users.Acquire", lambda: _acquire_ctx(conn))
    assert await users_db.verify_password("u1", "secret") is True


async def test_verify_password_returns_false_for_wrong(monkeypatch):
    pw_hash = bcrypt.hashpw(b"secret", bcrypt.gensalt()).decode()
    conn = MagicMock()
    conn.fetchrow = AsyncMock(return_value={"password_hash": pw_hash})
    monkeypatch.setattr("app.db.users.Acquire", lambda: _acquire_ctx(conn))
    assert await users_db.verify_password("u1", "wrong") is False


async def test_verify_password_returns_false_for_missing_user(monkeypatch):
    conn = MagicMock()
    conn.fetchrow = AsyncMock(return_value=None)
    monkeypatch.setattr("app.db.users.Acquire", lambda: _acquire_ctx(conn))
    assert await users_db.verify_password("u1", "any") is False


async def test_email_exists_for_other_user(monkeypatch):
    conn = MagicMock()
    conn.fetchrow = AsyncMock(return_value={"id": "other"})
    monkeypatch.setattr("app.db.users.Acquire", lambda: _acquire_ctx(conn))
    assert await users_db.email_exists_for_other_user("x@y.com", "u1") is True


async def test_email_exists_for_other_user_returns_false_when_none(monkeypatch):
    conn = MagicMock()
    conn.fetchrow = AsyncMock(return_value=None)
    monkeypatch.setattr("app.db.users.Acquire", lambda: _acquire_ctx(conn))
    assert await users_db.email_exists_for_other_user("x@y.com", "u1") is False


async def test_update_password_hashes_and_updates(monkeypatch):
    captured = {}
    conn = MagicMock()

    async def fake_execute(*args):
        captured["sql"] = args[0]
        captured["args"] = args[1:]

    conn.execute = fake_execute
    monkeypatch.setattr("app.db.users.Acquire", lambda: _acquire_ctx(conn))
    await users_db.update_password("u1", "newsecret")
    assert "UPDATE users SET password_hash" in captured["sql"]
    assert captured["args"][1] == "u1"
    assert bcrypt.checkpw(b"newsecret", captured["args"][0].encode())
