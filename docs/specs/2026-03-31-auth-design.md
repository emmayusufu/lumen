# Auth Design Spec

## Overview

Multi-tenant authentication and authorization layer for the AI writing platform. Each deployment supports multiple organizations (teams) sharing one Zitadel instance — similar to GitLab's self-hosted model. A team self-provisions by signing up; the first user becomes the org admin.

Identity providers: email/password, GitHub, Google (all configured in Zitadel, surfaced through a single OIDC endpoint).

---

## Architecture

### Services

| Service | Tech | Port | Role |
|---|---|---|---|
| `traefik` | Traefik v3 | 80/443 | Edge router, JWT validation via plugin + OPA |
| `zitadel` | Zitadel | 8080 | IAM, OIDC provider, multi-org |
| `opa` | Open Policy Agent | 8181 | JWT denylist + authorization policies |
| `postgres` | PostgreSQL 17 | 5433 | Shared DB: Zitadel schema + app schema |
| `web` | Next.js 16 | 3000 | Frontend, NextAuth session management |
| `research-api` | FastAPI | 8000 | AI research, reads user context from headers |

### Request Flow

```
Internet
    │
  Traefik :80/:443
    │
    ├── /              → web (public)
    ├── /auth/*        → zitadel (public)
    ├── /api/research  → research-api (JWT required)
    └── /api/content   → content-api (JWT required, future)
```

For every protected route, Traefik:
1. Validates JWT signature against Zitadel JWKS (cached in-memory)
2. Checks token JTI against OPA denylist
3. Injects `X-User-Id`, `X-User-Org`, `X-User-Email` headers
4. Forwards to service — or returns 401

Services never see or validate a JWT. They read pre-validated headers only.

---

## Zitadel Multi-Org Model

One Zitadel instance per deployment. Each team = one Zitadel organization.

```
Zitadel Instance
    ├── Org: "Acme Team"     (org_abc123)
    │     ├── alice@acme.com  (admin)
    │     └── bob@acme.com    (member)
    └── Org: "Startup XYZ"   (org_xyz456)
          └── carol@xyz.com   (admin)
```

Identity providers (GitHub, Google, email/password) are configured at the instance level and inherited by all orgs automatically.

### Self-Service Org Provisioning

1. User visits `/signup`
2. Fills in: org name, display name, email, password (or GitHub/Google)
3. Frontend calls Zitadel management API via a machine account → creates org + first user as admin
4. User is redirected to `/login` scoped to their new org
5. On first authenticated API request, `user_profiles` row is upserted in PostgreSQL

---

## Auth Flows

### Signup (new org)

```
/signup form submit
↓
web → Zitadel management API (machine account): create org + admin user
↓
redirect to /login
↓
NextAuth OIDC flow (see Login below)
↓
first API request → upsert user_profiles row
```

### Login (returning user)

```
/login
↓
NextAuth → Zitadel OIDC authorize endpoint
↓
User authenticates (email/pass, GitHub, or Google)
↓
Zitadel → NextAuth callback with authorization code
↓
NextAuth exchanges code for access_token + refresh_token + id_token
↓
NextAuth stores tokens in encrypted session cookie (JWT strategy)
↓
User lands on dashboard
```

### Token Refresh

NextAuth handles silently via the `jwt` callback using the refresh token. Transparent to the user and all backend services. Access token TTL: 15 minutes.

### Token Revocation

```
Token revoked (logout / admin action)
↓
Zitadel fires webhook → OPA API
↓
OPA stores { jti: expiry_timestamp } in revoked_tokens
↓
Next request with that token → OPA checks JTI + expiry → denies → Traefik returns 401
↓
After token's original expiry, JWT plugin rejects on exp claim anyway — denylist entry becomes inert
```

---

## JWT Validation (Traefik + OPA)

### Traefik JWT Plugin

Validates token inline on every protected request:
- Signature verification against Zitadel JWKS (cached, refreshed on unknown key ID)
- Expiry, issuer, audience checks
- Passes token claims to OPA for denylist check

### OPA Denylist Policy (`policies/jwt.rego`)

```rego
package jwt

default allow = false

allow {
    not revoked
}

revoked {
    expiry := data.revoked_tokens[input.jti]
    now := time.now_ns() / 1000000000
    now < expiry
}
```

OPA data is in-memory. Revoked JTIs are stored as `{ jti: expiry_unix_timestamp }` via Zitadel webhook. The policy treats an entry as active only while `now < expiry` — once the token's original lifetime passes, the entry becomes inert (the JWT plugin would reject it on `exp` claim regardless). No cleanup job needed.

### Headers Injected by Traefik

| Header | Value |
|---|---|
| `X-User-Id` | Zitadel user ID (`sub` claim) |
| `X-User-Org` | Zitadel org ID |
| `X-User-Email` | User email |

---

## Frontend (NextAuth)

### New Files

```
apps/web/src/
  app/api/auth/[...nextauth]/route.ts   NextAuth handler
  app/(auth)/login/page.tsx             Login page
  app/(auth)/signup/page.tsx            Org creation + first user registration
  lib/auth.ts                           NextAuth config
  middleware.ts                         Route protection
```

### Route Protection (`middleware.ts`)

- Public: `/login`, `/signup`, `/auth/*`
- Protected: everything else → redirect to `/login` if no session

### Provider Config

NextAuth is configured with a single Zitadel OIDC provider. GitHub and Google are identity providers inside Zitadel — not separate NextAuth providers. All identities flow through one OIDC endpoint.

---

## Backend User Context (research-api)

### New Files

```
apps/backend/app/
  middleware/auth.py     reads Traefik headers, attaches User to request.state
  models/user.py         User(id, org_id, email)
```

### Middleware

Reads `X-User-Id`, `X-User-Org`, `X-User-Email` from every request and sets `request.state.user`. Route handlers declare `Depends(current_user)` to get a typed `User` object.

### user_profiles Upsert

On first authenticated request, the middleware checks for an existing `user_profiles` row. If absent, it inserts one with `display_name` derived from email. Silent, no extra round trip.

---

## Docker Compose

### New Services

```yaml
traefik    Traefik v3 with JWT plugin and OPA middleware configured
zitadel    Zitadel latest, depends on postgres
opa        OPA latest, loads policies from ./policies/
postgres   PostgreSQL 17, two databases: zitadel + app
```

### Zitadel Init

A one-time init container (`apps/zitadel-init/`) runs on first boot via `docker compose --profile init`:

- Creates machine account for org provisioning
- Enables email/password login
- Configures GitHub IdP
- Configures Google IdP
- Creates NextAuth OIDC application in Zitadel
- Sets access token TTL to 15 minutes
- Configures Zitadel webhook → OPA on token revocation

### Startup Order

```
postgres → zitadel → opa → traefik → research-api + web
```

### New `.env` Variables

```
ZITADEL_DOMAIN=localhost
ZITADEL_ADMIN_SECRET=
ZITADEL_MACHINE_KEY=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
POSTGRES_PASSWORD=
```

---

## Database

PostgreSQL 17, two schemas in one instance:

- `zitadel` — managed entirely by Zitadel
- `app` — application tables (`user_profiles`, `documents`, etc.)

`user_profiles` table (created as part of auth scope):

| Column | Type |
|---|---|
| zitadel_user_id | TEXT PK |
| display_name | TEXT |
| bio | TEXT |
| avatar_url | TEXT |
| created_at | TIMESTAMPTZ |

---

## Non-Goals (auth scope)

- No OPA authorization policies beyond JWT denylist (documents, research policies are later)
- No admin UI for managing orgs (use Zitadel console)
- No email verification flow (Zitadel handles this)
- No 2FA config (can be enabled in Zitadel console post-setup)
