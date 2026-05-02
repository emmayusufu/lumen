# Changelog

## 0.1.0 - 2026-05-03

First public release.

- Rich-text editor on TipTap with code blocks, tables, image upload, slash menu
- Real-time collaboration via Hocuspocus and Yjs, live cursors and presence avatars
- Nested pages with cycle-checked moves and cascade delete
- Threaded comments anchored as TipTap marks so highlights survive edits
- Inline AI writer/editor built on LangGraph, powered by DeepSeek
- Fact-check via Serper, results streamed back as decorations
- Mermaid and PlantUML diagrams rendered through self-hosted Kroki
- PDF export via WeasyPrint, Markdown export via turndown
- Image uploads go straight to MinIO from the browser via presigned PUT
- Workspaces, members, copy-link invites, per-doc and workspace-wide visibility
- OPA Rego authorization, JWT cookie auth, bcrypt password hashing
- OpenTelemetry traces and logs to HyperDX, browser session replay
- Single-VM Docker compose deploy with Caddy auto-HTTPS
