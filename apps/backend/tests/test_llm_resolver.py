import uuid
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from app.services.llm_resolver import get_user_llm


@pytest.mark.asyncio
async def test_resolver_uses_user_key_when_set():
    ws_id = uuid.uuid4()
    with (
        patch(
            "app.services.llm_resolver.credentials.get_user_key",
            AsyncMock(return_value="sk-user"),
        ),
        patch(
            "app.services.llm_resolver.credentials.get_workspace_key",
            AsyncMock(return_value="sk-org"),
        ) as mock_ws,
    ):
        llm = await get_user_llm("u1", ws_id)
    assert llm.openai_api_key.get_secret_value() == "sk-user"
    mock_ws.assert_not_awaited()


@pytest.mark.asyncio
async def test_resolver_falls_back_to_workspace_key():
    ws_id = uuid.uuid4()
    with (
        patch(
            "app.services.llm_resolver.credentials.get_user_key",
            AsyncMock(return_value=None),
        ),
        patch(
            "app.services.llm_resolver.credentials.get_workspace_key",
            AsyncMock(return_value="sk-org"),
        ),
    ):
        llm = await get_user_llm("u1", ws_id)
    assert llm.openai_api_key.get_secret_value() == "sk-org"


@pytest.mark.asyncio
async def test_resolver_raises_400_when_no_keys():
    ws_id = uuid.uuid4()
    with (
        patch(
            "app.services.llm_resolver.credentials.get_user_key",
            AsyncMock(return_value=None),
        ),
        patch(
            "app.services.llm_resolver.credentials.get_workspace_key",
            AsyncMock(return_value=None),
        ),
        pytest.raises(HTTPException) as exc,
    ):
        await get_user_llm("u1", ws_id)
    assert exc.value.status_code == 400
    assert exc.value.detail["code"] == "no_credentials"
