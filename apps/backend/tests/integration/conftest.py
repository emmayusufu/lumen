import os
import secrets
from collections.abc import AsyncIterator
from pathlib import Path

os.environ.setdefault("SECRET_KEY", secrets.token_hex(32))

import httpx
import pytest
import pytest_asyncio
from testcontainers.core.container import DockerContainer
from testcontainers.core.waiting_utils import wait_for_logs
from testcontainers.postgres import PostgresContainer
from testcontainers.redis import RedisContainer

REPO_ROOT = Path(__file__).resolve().parents[4]
POLICIES_DIR = REPO_ROOT / "policies"


def pytest_collection_modifyitems(config, items):
    for item in items:
        if "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)


@pytest.fixture(scope="session")
def postgres_container():
    with PostgresContainer("postgres:18.3-alpine", driver=None) as pg:
        yield pg


@pytest.fixture(scope="session")
def redis_container():
    with RedisContainer("redis:7-alpine") as r:
        yield r


@pytest.fixture(scope="session")
def opa_container():
    container = (
        DockerContainer("openpolicyagent/opa:latest-debug")
        .with_command("run --server --addr :8181 /policies")
        .with_volume_mapping(str(POLICIES_DIR), "/policies", "ro")
        .with_exposed_ports(8181)
    )
    container.start()
    try:
        wait_for_logs(container, "Initializing server", timeout=30)
        yield container
    finally:
        container.stop()


@pytest.fixture(scope="session", autouse=True)
def _configure_env(postgres_container, redis_container, opa_container):
    os.environ["DATABASE_URL"] = postgres_container.get_connection_url().replace(
        "postgresql+psycopg2://", "postgresql://"
    )
    redis_host = redis_container.get_container_host_ip()
    redis_port = redis_container.get_exposed_port(6379)
    os.environ["REDIS_URL"] = f"redis://{redis_host}:{redis_port}/0"
    opa_host = opa_container.get_container_host_ip()
    opa_port = opa_container.get_exposed_port(8181)
    os.environ["OPA_URL"] = f"http://{opa_host}:{opa_port}"
    os.environ.setdefault("SECRET_KEY", secrets.token_hex(32))

    import app.config as cfg

    cfg.OPA_URL = os.environ["OPA_URL"]
    for mod in ("app.middleware.opa", "app.middleware.auth", "app.routers.auth"):
        try:
            import importlib

            m = importlib.import_module(mod)
            if hasattr(m, "OPA_URL"):
                m.OPA_URL = os.environ["OPA_URL"]
        except ImportError:
            pass
    yield


@pytest_asyncio.fixture(scope="session")
async def _initialized_pool(_configure_env) -> AsyncIterator[None]:
    from app.db import close_pool, init_pool
    from app.db.migrations import run_pending

    await init_pool()
    await run_pending()
    yield
    await close_pool()


@pytest_asyncio.fixture
async def db_clean(_initialized_pool):
    from app.db import Acquire
    from app.middleware import ratelimit as rl

    async with Acquire() as conn:
        rows = await conn.fetch(
            "SELECT tablename FROM pg_tables "
            "WHERE schemaname = 'public' AND tablename != 'schema_migrations'"
        )
        if rows:
            names = ", ".join(f'"{r["tablename"]}"' for r in rows)
            await conn.execute(f"TRUNCATE {names} RESTART IDENTITY CASCADE")

    rl._fallback.clear()
    client = rl._client()
    if client is not None:
        await client.flushdb()
    yield


@pytest_asyncio.fixture
async def client(db_clean) -> AsyncIterator[httpx.AsyncClient]:
    from app.main import app

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def signed_up_user(client: httpx.AsyncClient) -> dict:
    email = f"alice-{secrets.token_hex(4)}@acme.test"
    resp = await client.post(
        "/api/v1/auth/signup",
        json={
            "workspaceName": "Acme",
            "firstName": "Alice",
            "lastName": "Smith",
            "email": email,
            "password": "password123",
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json() | {"password": "password123", "email": email}


@pytest_asyncio.fixture
async def make_client(db_clean):
    import bcrypt

    from app.db import users as users_db
    from app.db import workspaces as workspaces_db
    from app.main import app

    transport = httpx.ASGITransport(app=app)
    clients: list[httpx.AsyncClient] = []

    async def new_workspace(
        email: str, workspace_name: str = "Acme"
    ) -> tuple[httpx.AsyncClient, dict]:
        c = httpx.AsyncClient(transport=transport, base_url="http://test")
        clients.append(c)
        resp = await c.post(
            "/api/v1/auth/signup",
            json={
                "workspaceName": workspace_name,
                "firstName": "User",
                "lastName": email.split("@")[0],
                "email": email,
                "password": "password123",
            },
        )
        assert resp.status_code == 201, resp.text
        return c, resp.json()

    async def in_workspace(
        workspace_id, email: str, role: str = "editor"
    ) -> tuple[httpx.AsyncClient, dict]:
        pwd_hash = bcrypt.hashpw(b"password123", bcrypt.gensalt(4)).decode()
        user_id = await users_db.create_user(email, pwd_hash, email.split("@")[0])
        await workspaces_db.add_member(workspace_id, user_id, role)
        c = httpx.AsyncClient(transport=transport, base_url="http://test")
        clients.append(c)
        resp = await c.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "password123"},
        )
        assert resp.status_code == 200, resp.text
        return c, {"id": user_id, "email": email, "workspace_id": workspace_id, "role": role}

    class Factory:
        pass

    Factory.new_workspace = staticmethod(new_workspace)
    Factory.in_workspace = staticmethod(in_workspace)
    yield Factory
    for c in clients:
        await c.aclose()
