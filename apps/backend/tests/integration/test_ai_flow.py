import httpx
import pytest


class _FakeChunk:
    def __init__(self, text: str) -> None:
        self.content = text


class _FakeLLM:
    def __init__(self, tokens: list[str]) -> None:
        self._tokens = tokens

    async def astream(self, _messages):
        for t in self._tokens:
            yield _FakeChunk(t)


def _parse_sse(raw: str) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    for block in raw.split("\n\n"):
        event, data = "message", ""
        for line in block.split("\n"):
            if line.startswith("event: "):
                event = line[7:]
            elif line.startswith("data: "):
                data = line[6:]
        if data:
            out.append((event, data))
    return out


@pytest.fixture
def stub_llm(monkeypatch):
    def _install(tokens: list[str]):
        async def fake(_user_id, _workspace_id):
            return _FakeLLM(tokens)

        monkeypatch.setattr("app.routers.ai.get_user_llm", fake)

    return _install


async def _make_doc_with_content(c: httpx.AsyncClient, content: str) -> str:
    doc_id = (await c.post("/api/v1/content/docs", json={"title": "T"})).json()["id"]
    await c.patch(f"/api/v1/content/docs/{doc_id}", json={"content": content})
    return doc_id


async def test_summarize_streams_tokens_then_done(make_client, stub_llm):
    alice_c, _ = await make_client.new_workspace("alice@acme.test")
    doc_id = await _make_doc_with_content(alice_c, "<p>Lumen is great.</p>")
    stub_llm(["Lumen ", "is ", "great."])

    resp = await alice_c.get(f"/api/v1/ai/summarize/{doc_id}?length=short")
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    tokens = [d for e, d in events if e == "token"]
    assert len(tokens) == 3
    assert events[-1][0] == "done"


async def test_summarize_empty_doc_emits_only_done(make_client, stub_llm):
    alice_c, _ = await make_client.new_workspace("alice@acme.test")
    doc_id = (await alice_c.post("/api/v1/content/docs", json={"title": "Empty"})).json()["id"]
    stub_llm(["should-not-stream"])

    resp = await alice_c.get(f"/api/v1/ai/summarize/{doc_id}")
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    assert [e for e, _ in events] == ["done"]


async def test_summarize_outsider_gets_403(make_client, stub_llm):
    alice_c, _ = await make_client.new_workspace("alice@acme.test", workspace_name="Acme")
    doc_id = await _make_doc_with_content(alice_c, "<p>secret</p>")
    stub_llm(["won't reach"])

    bob_c, _ = await make_client.new_workspace("bob@globex.test", workspace_name="Globex")
    resp = await bob_c.get(f"/api/v1/ai/summarize/{doc_id}")
    assert resp.status_code == 403


async def test_summarize_unauthenticated_gets_401(client, stub_llm):
    import uuid as _uuid

    resp = await client.get(f"/api/v1/ai/summarize/{_uuid.uuid4()}")
    assert resp.status_code == 401


async def test_inline_ai_runs_graph(make_client, monkeypatch):
    async def fake(_user_id, _workspace_id):
        return _FakeLLM([])

    monkeypatch.setattr("app.routers.ai.get_user_llm", fake)

    async def fake_run_graph(state, emit, _llm):
        await emit("draft_chunk", {"text": "stub"})
        await emit("done", {})

    monkeypatch.setattr("app.routers.ai.run_inline_graph", fake_run_graph)

    alice_c, _ = await make_client.new_workspace("alice@acme.test")
    resp = await alice_c.post(
        "/api/v1/ai/inline",
        json={"action": "improve", "selection": "hello", "context": ""},
    )
    assert resp.status_code == 200
    events = _parse_sse(resp.text)
    kinds = [e for e, _ in events]
    assert "draft_chunk" in kinds
    assert kinds[-1] == "done"
