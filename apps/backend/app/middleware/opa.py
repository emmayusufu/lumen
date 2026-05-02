import httpx
from fastapi import HTTPException

from app.config import OPA_URL

_client: httpx.AsyncClient | None = None


def opa_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=5.0)
    return _client


async def close_opa_client() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


async def authorize(role: str | None, action: str) -> None:
    if not role:
        raise HTTPException(status_code=403)
    resp = await opa_client().post(
        f"{OPA_URL}/v1/data/authz/allow",
        json={"input": {"role": role, "action": action}},
    )
    resp.raise_for_status()
    if not resp.json().get("result", False):
        raise HTTPException(status_code=403)


async def authorize_workspace(workspace_role: str | None, action: str) -> None:
    if not workspace_role:
        raise HTTPException(status_code=403)
    resp = await opa_client().post(
        f"{OPA_URL}/v1/data/authz/allow",
        json={"input": {"workspace_role": workspace_role, "action": action}},
    )
    resp.raise_for_status()
    if not resp.json().get("result", False):
        raise HTTPException(status_code=403)
