import os

import asyncpg

_pool: asyncpg.Pool | None = None


async def init_pool() -> None:
    global _pool
    _pool = await asyncpg.create_pool(os.environ["DATABASE_URL"])


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("DB pool not initialized")
    return _pool


class Acquire:
    async def __aenter__(self) -> asyncpg.Connection:
        self._conn = await pool().acquire()
        return self._conn

    async def __aexit__(self, *_) -> None:
        await pool().release(self._conn)
