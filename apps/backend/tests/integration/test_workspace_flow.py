async def test_list_my_workspaces_returns_created_workspace(make_client):
    alice_c, _alice = await make_client.new_workspace("alice@acme.test", workspace_name="Acme")
    resp = await alice_c.get("/api/v1/workspaces")
    assert resp.status_code == 200
    workspaces = resp.json()
    assert len(workspaces) == 1
    assert workspaces[0]["name"] == "Acme"
    assert workspaces[0]["role"] == "admin"


async def test_create_additional_workspace(make_client):
    alice_c, _ = await make_client.new_workspace("alice@acme.test")
    resp = await alice_c.post("/api/v1/workspaces", json={"name": "Side Project"})
    assert resp.status_code == 201
    assert resp.json()["role"] == "admin"

    listed = (await alice_c.get("/api/v1/workspaces")).json()
    assert len(listed) == 2


async def test_list_members_admin_sees_all(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    slug = alice["workspace"]["slug"]
    await make_client.in_workspace(alice["workspace"]["id"], "bob@acme.test", role="editor")

    resp = await alice_c.get(f"/api/v1/w/{slug}/members")
    assert resp.status_code == 200
    members = resp.json()
    assert len(members) == 2
    emails = {m["email"] for m in members}
    assert emails == {"alice@acme.test", "bob@acme.test"}


async def test_change_role_admin_to_editor(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    slug = alice["workspace"]["slug"]
    _, bob = await make_client.in_workspace(
        alice["workspace"]["id"], "bob@acme.test", role="editor"
    )

    resp = await alice_c.patch(
        f"/api/v1/w/{slug}/members/{bob['id']}",
        json={"role": "admin"},
    )
    assert resp.status_code == 204


async def test_cannot_demote_last_admin(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    slug = alice["workspace"]["slug"]

    resp = await alice_c.patch(
        f"/api/v1/w/{slug}/members/{alice['id']}",
        json={"role": "editor"},
    )
    assert resp.status_code == 400
    assert "Promote another admin first" in resp.json()["detail"]


async def test_editor_cannot_manage_members(make_client):
    _alice_c, alice = await make_client.new_workspace("alice@acme.test")
    slug = alice["workspace"]["slug"]
    bob_c, _bob = await make_client.in_workspace(
        alice["workspace"]["id"], "bob@acme.test", role="editor"
    )

    resp = await bob_c.patch(
        f"/api/v1/w/{slug}/members/{alice['id']}",
        json={"role": "editor"},
    )
    assert resp.status_code == 403


async def test_member_can_leave(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    slug = alice["workspace"]["slug"]
    bob_c, bob = await make_client.in_workspace(
        alice["workspace"]["id"], "bob@acme.test", role="editor"
    )

    resp = await bob_c.delete(f"/api/v1/w/{slug}/members/{bob['id']}")
    assert resp.status_code == 204

    listed = (await alice_c.get(f"/api/v1/w/{slug}/members")).json()
    assert len(listed) == 1


async def test_last_admin_cannot_leave(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    slug = alice["workspace"]["slug"]
    resp = await alice_c.delete(f"/api/v1/w/{slug}/members/{alice['id']}")
    assert resp.status_code == 400


async def test_rename_workspace(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test", workspace_name="Old")
    slug = alice["workspace"]["slug"]
    resp = await alice_c.patch(f"/api/v1/w/{slug}", json={"name": "New"})
    assert resp.status_code == 204
    listed = (await alice_c.get("/api/v1/workspaces")).json()
    assert listed[0]["name"] == "New"
