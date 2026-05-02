import uuid

import pytest
from fastapi import HTTPException

from app.middleware.ratelimit import rate_limit
from app.models.user import User


def _user() -> User:
    return User(id=str(uuid.uuid4()), email="u@test", name="U")


async def test_per_minute_limit_triggers_429(db_clean):
    dep = rate_limit(per_minute=3, per_hour=300)
    user = _user()

    for _ in range(3):
        assert (await dep(user=user)).id == user.id

    with pytest.raises(HTTPException) as exc:
        await dep(user=user)
    assert exc.value.status_code == 429
    assert "Slow down" in exc.value.detail


async def test_hourly_limit_beats_minute_limit(db_clean):
    dep = rate_limit(per_minute=100, per_hour=2)
    user = _user()

    await dep(user=user)
    await dep(user=user)

    with pytest.raises(HTTPException) as exc:
        await dep(user=user)
    assert exc.value.status_code == 429
    assert "Hourly" in exc.value.detail


async def test_each_user_has_independent_counter(db_clean):
    dep = rate_limit(per_minute=1, per_hour=300)
    alice, bob = _user(), _user()

    await dep(user=alice)
    await dep(user=bob)

    with pytest.raises(HTTPException) as alice_second:
        await dep(user=alice)
    assert alice_second.value.status_code == 429


async def test_redis_counter_is_observable(db_clean):
    from app.middleware import ratelimit as rl

    dep = rate_limit(per_minute=10, per_hour=300)
    user = _user()
    await dep(user=user)
    await dep(user=user)

    client = rl._client()
    assert client is not None
    keys = [k async for k in client.scan_iter(match=f"rate:{user.id}:m:*")]
    assert len(keys) == 1
    assert int(await client.get(keys[0])) == 2


async def test_fallback_to_memory_when_redis_down(db_clean, monkeypatch):
    from app.middleware import ratelimit as rl

    def explode(*_a, **_kw):
        raise ConnectionError("redis down")

    real_client = rl._client()
    monkeypatch.setattr(real_client, "pipeline", explode)

    dep = rate_limit(per_minute=2, per_hour=300)
    user = _user()

    await dep(user=user)
    await dep(user=user)
    with pytest.raises(HTTPException) as exc:
        await dep(user=user)
    assert exc.value.status_code == 429
