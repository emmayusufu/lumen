import uuid

import httpx


async def _me(c: httpx.AsyncClient) -> dict:
    return (await c.get("/api/v1/auth/me")).json()


async def _make_doc(c: httpx.AsyncClient) -> str:
    return (await c.post("/api/v1/content/docs", json={"title": "D"})).json()["id"]


async def test_create_thread_and_list(make_client):
    alice_c, _ = await make_client.new_workspace("alice@acme.test")
    doc_id = await _make_doc(alice_c)
    thread_id = str(uuid.uuid4())

    resp = await alice_c.post(
        f"/api/v1/content/docs/{doc_id}/comments",
        json={"thread_id": thread_id, "body": "First note"},
    )
    assert resp.status_code == 201

    threads = (await alice_c.get(f"/api/v1/content/docs/{doc_id}/comments")).json()
    assert len(threads) == 1
    assert threads[0]["id"] == thread_id
    assert threads[0]["resolved"] is False
    assert [m["body"] for m in threads[0]["messages"]] == ["First note"]


async def test_reply_appends_message(make_client):
    alice_c, _ = await make_client.new_workspace("alice@acme.test")
    doc_id = await _make_doc(alice_c)
    thread_id = str(uuid.uuid4())
    await alice_c.post(
        f"/api/v1/content/docs/{doc_id}/comments",
        json={"thread_id": thread_id, "body": "Q?"},
    )

    resp = await alice_c.post(f"/api/v1/content/comments/{thread_id}/messages", json={"body": "A."})
    assert resp.status_code == 201

    threads = (await alice_c.get(f"/api/v1/content/docs/{doc_id}/comments")).json()
    assert [m["body"] for m in threads[0]["messages"]] == ["Q?", "A."]


async def test_resolve_and_unresolve(make_client):
    alice_c, _ = await make_client.new_workspace("alice@acme.test")
    doc_id = await _make_doc(alice_c)
    thread_id = str(uuid.uuid4())
    await alice_c.post(
        f"/api/v1/content/docs/{doc_id}/comments",
        json={"thread_id": thread_id, "body": "x"},
    )

    assert (
        await alice_c.patch(f"/api/v1/content/comments/{thread_id}", json={"resolved": True})
    ).status_code == 204

    threads = (await alice_c.get(f"/api/v1/content/docs/{doc_id}/comments")).json()
    assert threads[0]["resolved"] is True

    await alice_c.patch(f"/api/v1/content/comments/{thread_id}", json={"resolved": False})
    threads = (await alice_c.get(f"/api/v1/content/docs/{doc_id}/comments")).json()
    assert threads[0]["resolved"] is False


async def test_viewer_cannot_create_thread(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    doc_id = await _make_doc(alice_c)

    bob_c, _ = await make_client.in_workspace(alice["workspace"]["id"], "bob@acme.test")
    await alice_c.post(
        f"/api/v1/content/docs/{doc_id}/collaborators",
        json={"email": "bob@acme.test", "role": "viewer"},
    )

    resp = await bob_c.post(
        f"/api/v1/content/docs/{doc_id}/comments",
        json={"thread_id": str(uuid.uuid4()), "body": "nope"},
    )
    assert resp.status_code == 403


async def test_only_creator_can_delete_thread(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    doc_id = await _make_doc(alice_c)

    bob_c, _ = await make_client.in_workspace(alice["workspace"]["id"], "bob@acme.test")
    await alice_c.post(
        f"/api/v1/content/docs/{doc_id}/collaborators",
        json={"email": "bob@acme.test", "role": "editor"},
    )

    thread_id = str(uuid.uuid4())
    await alice_c.post(
        f"/api/v1/content/docs/{doc_id}/comments",
        json={"thread_id": thread_id, "body": "alice thread"},
    )

    assert (await bob_c.delete(f"/api/v1/content/comments/{thread_id}")).status_code == 403
    assert (await alice_c.delete(f"/api/v1/content/comments/{thread_id}")).status_code == 204


async def test_outsider_cannot_read_comments(make_client):
    alice_c, _ = await make_client.new_workspace("alice@acme.test", workspace_name="Acme")
    doc_id = await _make_doc(alice_c)

    bob_c, _ = await make_client.new_workspace("bob@globex.test", workspace_name="Globex")
    resp = await bob_c.get(f"/api/v1/content/docs/{doc_id}/comments")
    assert resp.status_code == 403
