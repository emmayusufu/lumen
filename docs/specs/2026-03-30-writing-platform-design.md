# AI-Powered Writing Platform — Design Spec

## Overview

An AI-powered writing platform where writers research topics with a multi-agent system, write articles in a Gitbook-style markdown editor with AI co-pilot, collaborate in real-time, and publish to Medium, LinkedIn, Dev.to, or export as static markdown/HTML.

Built as microservices on top of the existing LangGraph research assistant, with Zitadel for auth and OPA for authorization.

## Architecture

### Services

| Service | Tech | Port | Responsibility |
|---------|------|------|---------------|
| `web` | Next.js 16 + MUI | 3200 | Frontend — editor, dashboard, publishing UI |
| `research-api` | Python + FastAPI | 8010 | Multi-agent research + AI co-pilot endpoints |
| `content-api` | Node.js + Fastify | 8020 | Documents, publishing, media |
| `sync-server` | Node.js + y-websocket | 1234 | Real-time collaboration |
| `zitadel` | Zitadel | 8080 | Authentication, user management, OIDC |
| `opa` | Open Policy Agent | 8181 | Authorization policies |
| `postgres` | PostgreSQL 17 | 5433 | Shared database |

### Service Communication

```
                    ┌──────────────┐
                    │   Zitadel    │
                    │  (Auth/IAM)  │
                    └──────┬───────┘
                           │ OIDC / JWT
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼───────┐  ┌───────▼───────┐  ┌───────▼───────┐
│  content-api  │  │ research-api  │  │  sync-server  │
│   (Node.js)   │  │  (FastAPI)    │  │ (y-websocket) │
└───────┬───────┘  └───────────────┘  └───────┬───────┘
        │                                      │
        └──────────────┬───────────────────────┘
                       │
                ┌──────▼───────┐
                │     OPA      │
                │  (policies)  │
                └──────────────┘

All services query OPA for authorization decisions.
All services validate JWTs issued by Zitadel.
```

### Monorepo Structure

```
├── apps/
│   ├── web/                         # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/          # Login/signup (Zitadel OIDC)
│   │   │   │   ├── (dashboard)/     # Document list, analytics
│   │   │   │   ├── (editor)/        # Markdown editor + research panel
│   │   │   │   └── (publish)/       # Publishing flow
│   │   │   ├── components/
│   │   │   │   ├── editor/          # Tiptap, toolbar, markdown preview
│   │   │   │   ├── research/        # Research panel, agent activity
│   │   │   │   ├── publish/         # Platform selectors, preview
│   │   │   │   ├── documents/       # Doc list, cards, search
│   │   │   │   └── layout/          # Header, nav, theme
│   │   │   ├── hooks/
│   │   │   └── lib/
│   │   └── package.json
│   ├── content-api/                 # Documents + publishing
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   └── index.ts
│   │   └── package.json
│   ├── research-api/                # AI agents (existing backend renamed)
│   │   ├── app/
│   │   │   ├── agents/
│   │   │   ├── tools/
│   │   │   ├── middleware/
│   │   │   ├── graph.py
│   │   │   ├── main.py
│   │   │   └── state.py
│   │   └── requirements.txt
│   └── sync-server/                 # Real-time collaboration
│       ├── src/
│       │   ├── server.ts
│       │   ├── auth.ts
│       │   └── persistence.ts
│       └── package.json
├── packages/
│   ├── tsconfig/                    # Shared TypeScript config
│   └── opa-client/                  # Shared OPA client library
├── policies/                        # Rego policy files
│   ├── documents.rego
│   ├── research.rego
│   └── collaboration.rego
├── docker-compose.yml
├── turbo.json
└── package.json
```

## Database Schema

PostgreSQL 17. Users are managed by Zitadel — we reference `zitadel_user_id` everywhere.

### user_profiles

Extends Zitadel user data with app-specific fields.

| Column | Type | Description |
|--------|------|-------------|
| zitadel_user_id | TEXT PK | Zitadel user ID |
| display_name | TEXT | Public display name |
| bio | TEXT | Writer bio |
| avatar_url | TEXT | Profile picture |
| created_at | TIMESTAMPTZ | When profile was created |

### documents

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Document ID |
| owner_id | TEXT | Zitadel user ID |
| title | TEXT | Document title |
| slug | TEXT | URL-friendly slug |
| content_markdown | TEXT | Raw markdown content |
| yjs_state | BYTEA | CRDT binary state for sync |
| status | TEXT | draft, published, archived |
| tags | TEXT[] | Topic tags |
| word_count | INTEGER | Auto-calculated word count |
| created_at | TIMESTAMPTZ | Creation time |
| updated_at | TIMESTAMPTZ | Last update |

### publications

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Publication ID |
| document_id | UUID FK | References documents |
| platform | TEXT | medium, linkedin, devto, static |
| platform_post_id | TEXT | ID from platform API |
| platform_url | TEXT | Published URL |
| published_at | TIMESTAMPTZ | When published |
| status | TEXT | pending, published, failed |
| metadata | JSONB | Platform-specific data |

### document_collaborators

| Column | Type | Description |
|--------|------|-------------|
| document_id | UUID FK | References documents |
| user_id | TEXT | Zitadel user ID |
| permission | TEXT | view, edit, admin |
| added_at | TIMESTAMPTZ | When added |
| PK | (document_id, user_id) | Composite primary key |

### research_sessions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Session ID |
| document_id | UUID FK | References documents |
| query | TEXT | Research query |
| results | JSONB | Agent results |
| created_at | TIMESTAMPTZ | When researched |

## Frontend

### Editor Page

Gitbook-style layout:

```
┌─────────────────────────────────────────────────────┐
│  [floating header bar]                               │
├───────────────────────────┬─────────────────────────┤
│                           │                         │
│   Markdown Editor         │   Live Preview          │
│   (Tiptap + Yjs)          │   (rendered markdown)   │
│                           │                         │
│   # My Article            │   My Article            │
│                           │   ─────────             │
│   Some text here...       │   Some text here...     │
│                           │                         │
│                           │                         │
├───────────────────────────┴─────────────────────────┤
│  [Research Panel — collapsible from right edge]      │
│  ┌───────────────────────────────────────────────┐  │
│  │ Ask: "What is Kubernetes?"          [Search]  │  │
│  │                                               │  │
│  │ ● Found 9 results                  [Insert]   │  │
│  │   - Kubernetes docs...             [Insert]   │  │
│  │   - K8s architecture...            [Insert]   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### AI Slash Commands

Triggered inline in the editor:

| Command | Action |
|---------|--------|
| `/outline "topic"` | Generate article outline |
| `/expand` | Expand current paragraph with more detail |
| `/rewrite` | Rewrite selected text |
| `/summarize` | Condense selected section |
| `/research "query"` | Open research panel with query |

Each command calls the `research-api` with the relevant context.

### Dashboard

- Document list with status badges (draft, published)
- Filter by tags, date, platform
- "New Document" button
- Per-document: title, word count, last edited, published platforms

### Publishing Flow

1. Writer clicks "Publish" on a document
2. Preview screen shows how the article will look on each platform
3. Writer selects platforms (checkboxes): Medium, LinkedIn, Dev.to, Export
4. Content-api calls each platform's API
5. Results screen shows published URLs or errors
6. Publication records saved in database

## API Endpoints

### research-api (existing + new)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/research` | POST | Full research query |
| `/api/research/stream` | POST | Research with SSE streaming |
| `/api/outline` | POST | Generate article outline from topic |
| `/api/expand` | POST | Expand a passage |
| `/api/rewrite` | POST | Rewrite text with tone/style |
| `/api/summarize` | POST | Condense text |

### content-api (new)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/documents` | GET | List user's documents |
| `/api/documents` | POST | Create document |
| `/api/documents/:id` | GET | Get document |
| `/api/documents/:id` | PUT | Update document |
| `/api/documents/:id` | DELETE | Delete document |
| `/api/documents/:id/publish` | POST | Publish to platforms |
| `/api/documents/:id/collaborators` | GET | List collaborators |
| `/api/documents/:id/collaborators` | POST | Add collaborator |
| `/api/documents/:id/collaborators/:userId` | DELETE | Remove collaborator |
| `/api/documents/:id/research` | GET | Get research sessions |
| `/api/publish/medium` | POST | Publish to Medium |
| `/api/publish/linkedin` | POST | Publish to LinkedIn |
| `/api/publish/devto` | POST | Publish to Dev.to |
| `/api/export/:id` | GET | Export as markdown/HTML |

## Auth Flow (Zitadel)

1. User visits `/login` → redirected to Zitadel OIDC login page
2. User authenticates → Zitadel redirects back with authorization code
3. Frontend exchanges code for JWT tokens (access + refresh)
4. All API calls include `Authorization: Bearer <token>` header
5. Each service validates the JWT against Zitadel's JWKS endpoint
6. User ID extracted from JWT claims, used for all ownership/permission checks

## Authorization (OPA)

Every mutation (create, edit, delete, publish) queries OPA before proceeding.

### policies/documents.rego

```rego
package documents

default allow = false

# Owner can do anything
allow {
    input.action == "read"
    input.resource.owner_id == input.user.id
}

allow {
    input.action == "write"
    input.resource.owner_id == input.user.id
}

allow {
    input.action == "delete"
    input.resource.owner_id == input.user.id
}

allow {
    input.action == "publish"
    input.resource.owner_id == input.user.id
}

# Collaborators with edit permission can read and write
allow {
    input.action == "read"
    input.resource.collaborators[_] == {"user_id": input.user.id, "permission": "edit"}
}

allow {
    input.action == "write"
    input.resource.collaborators[_] == {"user_id": input.user.id, "permission": "edit"}
}

# View-only collaborators can read
allow {
    input.action == "read"
    input.resource.collaborators[_] == {"user_id": input.user.id, "permission": "view"}
}
```

## Publishing Integration

### Medium

- Auth: Integration token (personal use) or OAuth for multi-user
- API: `POST https://api.medium.com/v1/users/{userId}/posts`
- Supports: HTML and markdown content, tags, canonical URL
- Stored in `.env`: `MEDIUM_TOKEN`

### LinkedIn

- Auth: OAuth 2.0 (requires LinkedIn app registration)
- API: `POST https://api.linkedin.com/v2/ugcPosts`
- Supports: Article posts with text + images
- Markdown must be converted to LinkedIn's markup format
- Stored in `.env`: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`

### Dev.to

- Auth: API key
- API: `POST https://dev.to/api/articles`
- Supports: Markdown natively, tags, series, canonical URL
- Stored in `.env`: `DEVTO_API_KEY`

### Static Export

- No API needed — generate markdown file with frontmatter (title, date, tags)
- Also generate HTML via a markdown renderer
- Download as zip or copy to clipboard

## Non-Goals (v1)

- No analytics dashboard (track in publishing platforms directly)
- No image hosting (use external URLs or platform uploads)
- No version history (Yjs handles undo, git-style history is later)
- No mobile app
- No Temporal, Unleash, Vault, Helm (Phase 2+)
