import httpx


async def test_admin_can_mint_invite(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    slug = alice["workspace"]["slug"]
    resp = await alice_c.post(f"/api/v1/w/{slug}/invites", json={"role": "editor"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["role"] == "editor"
    assert data["url"].endswith(data["token"])


async def test_editor_cannot_mint_invite(make_client):
    _, alice = await make_client.new_workspace("alice@acme.test")
    slug = alice["workspace"]["slug"]
    bob_c, _ = await make_client.in_workspace(
        alice["workspace"]["id"], "bob@acme.test", role="editor"
    )

    resp = await bob_c.post(f"/api/v1/w/{slug}/invites", json={"role": "editor"})
    assert resp.status_code == 403


async def test_preview_returns_workspace_info(make_client, client: httpx.AsyncClient):
    alice_c, alice = await make_client.new_workspace("alice@acme.test", workspace_name="Acme")
    slug = alice["workspace"]["slug"]
    minted = (await alice_c.post(f"/api/v1/w/{slug}/invites", json={"role": "editor"})).json()

    resp = await client.get(f"/api/v1/invites/{minted['token']}")
    assert resp.status_code == 200
    preview = resp.json()
    assert preview["workspace_name"] == "Acme"
    assert preview["role"] == "editor"
    assert preview["expired"] is False


async def test_logged_in_user_accepts_invite(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    slug = alice["workspace"]["slug"]
    minted = (await alice_c.post(f"/api/v1/w/{slug}/invites", json={"role": "editor"})).json()

    bob_c, _ = await make_client.new_workspace("bob@globex.test", workspace_name="Globex")
    resp = await bob_c.post(f"/api/v1/invites/{minted['token']}/accept")
    assert resp.status_code == 200
    assert resp.json()["slug"] == slug

    workspaces = (await bob_c.get("/api/v1/workspaces")).json()
    slugs = {w["slug"] for w in workspaces}
    assert slug in slugs


async def test_signup_via_invite_creates_user_and_joins(make_client, client: httpx.AsyncClient):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    slug = alice["workspace"]["slug"]
    minted = (await alice_c.post(f"/api/v1/w/{slug}/invites", json={"role": "editor"})).json()

    resp = await client.post(
        f"/api/v1/invites/{minted['token']}/signup",
        json={
            "firstName": "Carol",
            "lastName": "Jones",
            "email": "carol@example.com",
            "password": "password123",
        },
    )
    assert resp.status_code == 201
    assert resp.json()["workspace"]["slug"] == slug
    assert "token" in resp.cookies


async def test_accept_twice_is_idempotent(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    slug = alice["workspace"]["slug"]
    minted = (await alice_c.post(f"/api/v1/w/{slug}/invites", json={"role": "editor"})).json()

    bob_c, _ = await make_client.new_workspace("bob@globex.test")
    first = await bob_c.post(f"/api/v1/invites/{minted['token']}/accept")
    assert first.status_code == 200
    second = await bob_c.post(f"/api/v1/invites/{minted['token']}/accept")
    assert second.status_code == 410


async def test_revoked_invite_rejects_accept(make_client):
    alice_c, alice = await make_client.new_workspace("alice@acme.test")
    slug = alice["workspace"]["slug"]
    minted = (await alice_c.post(f"/api/v1/w/{slug}/invites", json={"role": "editor"})).json()

    assert (await alice_c.delete(f"/api/v1/w/{slug}/invites/{minted['token']}")).status_code == 204

    bob_c, _ = await make_client.new_workspace("bob@globex.test")
    resp = await bob_c.post(f"/api/v1/invites/{minted['token']}/accept")
    assert resp.status_code == 410
