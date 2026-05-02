async def test_workspace_member_cannot_see_other_workspace_docs(make_client):
    alice_c, _ = await make_client.new_workspace("alice@acme.test", workspace_name="Acme")
    globex_c, _ = await make_client.new_workspace("admin@globex.test", workspace_name="Globex")

    globex_doc = (
        await globex_c.post("/api/v1/content/docs", json={"title": "Globex secret"})
    ).json()["id"]
    await globex_c.patch(
        f"/api/v1/content/docs/{globex_doc}/visibility", json={"visibility": "workspace"}
    )

    resp = await alice_c.get(f"/api/v1/content/docs/{globex_doc}")
    assert resp.status_code == 403


async def test_workspace_list_is_scoped_to_memberships(make_client):
    alice_c, _ = await make_client.new_workspace("alice@acme.test")
    bob_c, _ = await make_client.new_workspace("bob@globex.test")

    alice_ws = (await alice_c.get("/api/v1/workspaces")).json()
    bob_ws = (await bob_c.get("/api/v1/workspaces")).json()

    assert len(alice_ws) == 1
    assert len(bob_ws) == 1
    assert alice_ws[0]["slug"] != bob_ws[0]["slug"]


async def test_user_in_two_workspaces_lists_both(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    bob_c, bob = await make_client.new_workspace("bob@globex.test")

    minted = (
        await alice_c.post(
            f"/api/v1/w/{alice['workspace']['slug']}/invites", json={"role": "editor"}
        )
    ).json()
    await bob_c.post(f"/api/v1/invites/{minted['token']}/accept")

    bob_ws = (await bob_c.get("/api/v1/workspaces")).json()
    assert len(bob_ws) == 2
    slugs = {w["slug"] for w in bob_ws}
    assert slugs == {alice["workspace"]["slug"], bob["workspace"]["slug"]}
