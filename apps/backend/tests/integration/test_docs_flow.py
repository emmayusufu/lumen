import httpx


async def _me(c: httpx.AsyncClient) -> dict:
    return (await c.get("/api/v1/auth/me")).json()


async def test_owner_creates_lists_and_reads_own_doc(make_client):
    alice_c, _ = await make_client.new_workspace("alice@acme.test")
    created = (await alice_c.post("/api/v1/content/docs", json={"title": "My Doc"})).json()
    doc_id = created["id"]

    listed = (await alice_c.get("/api/v1/content/docs")).json()
    assert len(listed) == 1
    assert listed[0]["id"] == doc_id
    assert listed[0]["role"] == "owner"

    doc = (await alice_c.get(f"/api/v1/content/docs/{doc_id}")).json()
    assert doc["role"] == "owner"
    assert doc["visibility"] == "private"


async def test_outsider_in_other_org_cannot_read(make_client):
    alice_c, _ = await make_client.new_workspace("alice@acme.test", workspace_name="Acme")
    doc_id = (await alice_c.post("/api/v1/content/docs", json={"title": "Secret"})).json()["id"]

    bob_c, _ = await make_client.new_workspace("bob@globex.test", workspace_name="Globex")
    resp = await bob_c.get(f"/api/v1/content/docs/{doc_id}")
    assert resp.status_code == 403


async def test_viewer_can_read_but_not_write(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    doc_id = (await alice_c.post("/api/v1/content/docs", json={"title": "D"})).json()["id"]

    bob_c, _ = await make_client.in_workspace(alice["workspace"]["id"], "bob@acme.test")
    assert (
        await alice_c.post(
            f"/api/v1/content/docs/{doc_id}/collaborators",
            json={"email": "bob@acme.test", "role": "viewer"},
        )
    ).status_code == 201

    assert (await bob_c.get(f"/api/v1/content/docs/{doc_id}")).status_code == 200
    assert (
        await bob_c.patch(f"/api/v1/content/docs/{doc_id}", json={"title": "X"})
    ).status_code == 403


async def test_editor_can_write_but_not_delete(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    doc_id = (await alice_c.post("/api/v1/content/docs", json={"title": "D"})).json()["id"]

    bob_c, _ = await make_client.in_workspace(alice["workspace"]["id"], "bob@acme.test")
    await alice_c.post(
        f"/api/v1/content/docs/{doc_id}/collaborators",
        json={"email": "bob@acme.test", "role": "editor"},
    )

    assert (
        await bob_c.patch(f"/api/v1/content/docs/{doc_id}", json={"content": "<p>hi</p>"})
    ).status_code == 204
    assert (await bob_c.delete(f"/api/v1/content/docs/{doc_id}")).status_code == 403


async def test_owner_can_delete(make_client):
    alice_c, _ = await make_client.new_workspace("alice@acme.test")
    doc_id = (await alice_c.post("/api/v1/content/docs", json={"title": "D"})).json()["id"]

    assert (await alice_c.delete(f"/api/v1/content/docs/{doc_id}")).status_code == 204
    assert (await alice_c.get(f"/api/v1/content/docs/{doc_id}")).status_code == 403


async def test_org_visibility_lets_same_org_user_read(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    doc_id = (await alice_c.post("/api/v1/content/docs", json={"title": "Shared"})).json()["id"]

    bob_c, _ = await make_client.in_workspace(alice["workspace"]["id"], "bob@acme.test")
    assert (await bob_c.get(f"/api/v1/content/docs/{doc_id}")).status_code == 403

    assert (
        await alice_c.patch(
            f"/api/v1/content/docs/{doc_id}/visibility", json={"visibility": "workspace"}
        )
    ).status_code == 204

    resp = await bob_c.get(f"/api/v1/content/docs/{doc_id}")
    assert resp.status_code == 200
    assert resp.json()["role"] == "editor"


async def test_only_owner_can_change_visibility(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    doc_id = (await alice_c.post("/api/v1/content/docs", json={"title": "D"})).json()["id"]

    bob_c, _ = await make_client.in_workspace(alice["workspace"]["id"], "bob@acme.test")
    await alice_c.post(
        f"/api/v1/content/docs/{doc_id}/collaborators",
        json={"email": "bob@acme.test", "role": "editor"},
    )

    resp = await bob_c.patch(
        f"/api/v1/content/docs/{doc_id}/visibility", json={"visibility": "workspace"}
    )
    assert resp.status_code == 403


async def test_non_owner_cannot_manage_collaborators(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    doc_id = (await alice_c.post("/api/v1/content/docs", json={"title": "D"})).json()["id"]

    bob_c, _ = await make_client.in_workspace(alice["workspace"]["id"], "bob@acme.test")
    await alice_c.post(
        f"/api/v1/content/docs/{doc_id}/collaborators",
        json={"email": "bob@acme.test", "role": "editor"},
    )
    await make_client.in_workspace(alice["workspace"]["id"], "carol@acme.test")

    resp = await bob_c.post(
        f"/api/v1/content/docs/{doc_id}/collaborators",
        json={"email": "carol@acme.test", "role": "viewer"},
    )
    assert resp.status_code == 403


async def test_workspace_editor_can_edit_workspace_visibility_doc(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    doc_id = (await alice_c.post("/api/v1/content/docs", json={"title": "Shared"})).json()["id"]

    assert (
        await alice_c.patch(
            f"/api/v1/content/docs/{doc_id}/visibility", json={"visibility": "workspace"}
        )
    ).status_code == 204

    bob_c, _ = await make_client.in_workspace(
        alice["workspace"]["id"], "bob@acme.test", role="editor"
    )
    resp = await bob_c.patch(f"/api/v1/content/docs/{doc_id}", json={"content": "<p>edited</p>"})
    assert resp.status_code == 204


async def test_workspace_viewer_can_only_read_workspace_visibility_doc(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    doc_id = (await alice_c.post("/api/v1/content/docs", json={"title": "Shared"})).json()["id"]
    await alice_c.patch(
        f"/api/v1/content/docs/{doc_id}/visibility", json={"visibility": "workspace"}
    )

    bob_c, _ = await make_client.in_workspace(
        alice["workspace"]["id"], "bob@acme.test", role="viewer"
    )
    assert (await bob_c.get(f"/api/v1/content/docs/{doc_id}")).status_code == 200
    assert (
        await bob_c.patch(f"/api/v1/content/docs/{doc_id}", json={"content": "x"})
    ).status_code == 403
