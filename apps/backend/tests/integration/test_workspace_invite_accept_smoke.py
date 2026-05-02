import uuid as _uuid

import pytest

from app.db import workspaces as ws_db


@pytest.mark.asyncio
async def test_create_invite_does_not_compare_naive_datetimes(make_client):
    """Regression: accept_invite must not raise TypeError from naive/aware datetime mix."""
    _, alice = await make_client.new_workspace("alice@acme.test")
    wid = alice["workspace"]["id"]
    invite = await ws_db.create_invite(_uuid.UUID(wid), "editor", alice["id"])
    _, bob = await make_client.new_workspace("bob@globex.test")
    ws = await ws_db.accept_invite(invite["token"], bob["id"])
    assert ws is not None
    assert str(ws["id"]) == wid
