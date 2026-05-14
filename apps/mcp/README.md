# lumen-mcp

MCP server for [Lumen](https://github.com/emmayusufu/lumen). Lets Claude Code, Claude Desktop, Cursor, or any MCP-compatible client read and write your Lumen docs through your normal account.

Things you can ask Claude after wiring it up:

- List the docs in my Mia & Sam workspace.
- Create a doc called Q3 planning under Platform engineering notes, with these bullets.
- Read the Onboarding doc and summarize what's open.
- Append a Decisions section to the Architecture decisions doc.

The server is a thin translation layer between Claude's JSON-RPC tool calls and Lumen's HTTP API. It runs locally with your token, so OPA Rego policies, rate limits, and visibility rules apply the same as if you'd hit the API yourself.

## Install

```bash
npm install -g @emmanuelkimaswa/lumen-mcp
```

## Configure

Log in to Lumen in a browser, open DevTools, copy the value of the `token` cookie. That's your `LUMEN_TOKEN`.

### Claude Desktop / Claude Code

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (or your platform's equivalent):

```json
{
  "mcpServers": {
    "lumen": {
      "command": "lumen-mcp",
      "env": {
        "LUMEN_URL": "https://lumen.jengahq.com",
        "LUMEN_TOKEN": "your-token-here"
      }
    }
  }
}
```

Restart the client. Lumen's tools show up in the tools list.

### Cursor

Same JSON shape, dropped into Cursor's MCP settings.

## Tools

| Name | What it does |
|---|---|
| `list_workspaces` | Lists workspaces you can access |
| `list_docs` | Lists docs, optionally filtered by `workspace_slug` |
| `read_doc` | Returns a doc's title, HTML content, metadata |
| `create_doc` | Creates a new doc, optionally as a subpage with initial HTML |
| `append_to_doc` | Appends HTML to the end of a doc |
| `rename_doc` | Renames a doc |
| `list_comments` | Lists comment threads on a doc |

I left destructive operations out on purpose. No delete, no remove-collaborator, no move. If you need those, the web UI is right there.

## Develop

```bash
cd apps/mcp
npm install
npm run dev
npm run build
```

The server reads JSON-RPC on stdin. You can poke it manually:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  LUMEN_URL=... LUMEN_TOKEN=... npm run -s start
```

## License

MIT.
