# Backend Auth & API Versioning — Design Spec

## Goal

Replace Zitadel + NextAuth with backend-owned authentication. FastAPI issues and validates JWTs. OPA gates every authenticated request (revocation) and every doc operation (RBAC). All API routes move to `/api/v1/`. Remove Zitadel, Traefik, and docker-proxy entirely.

---

## Architecture

```
Browser
  │  httpOnly cookie (token=<jwt>) sent automatically
  ▼
Next.js (:3847)
  │  /api/backend/* proxy — forwards Cookie header, passes Set-Cookie back
  ▼
FastAPI (:8742)
  │  auth middleware — decodes JWT, calls OPA /v1/data/jwt/allow (revocation)
  │  sets request.state.user or returns 401
  ▼
OPA (:8181)
  │  jwt.rego  — revocation store, checked on every authenticated request
  │  authz.rego — doc RBAC (owner / editor / viewer), checked on doc operations
  ▼
Postgres (:5432)
  └── orgs, users, sessions, docs, doc_collaborators
```

**Request lifecycle:**
1. Browser sends any API call — httpOnly cookie is attached automatically
2. Next.js proxy strips `/api/backend`, forwards request with `Cookie` header to backend
3. FastAPI auth middleware extracts JWT, decodes it, calls OPA jwt.rego with `{jti}`
4. OPA allows → `request.state.user` populated; OPA denies or JWT invalid → 401
5. Doc endpoints additionally call OPA authz.rego with `{role, action}` before proceeding
6. Login/signup: backend sets `Set-Cookie`, proxy passes it to the browser
7. Logout: backend adds `jti` + `exp` to OPA revocation store, clears cookie

---

## API Versioning

All backend routes move to `/api/v1/`. Health check stays unversioned.

| Before | After |
|--------|-------|
| `POST /api/research` | `POST /api/v1/research` |
| `POST /api/research/stream` | `POST /api/v1/research/stream` |
| `GET /api/sessions` | `GET /api/v1/sessions` |
| `GET /api/sessions/:id` | `GET /api/v1/sessions/:id` |
| `DELETE /api/sessions/:id` | `DELETE /api/v1/sessions/:id` |
| `GET /api/content/docs` | `GET /api/v1/content/docs` |
| `POST /api/content/docs` | `POST /api/v1/content/docs` |
| `GET /api/content/docs/:id` | `GET /api/v1/content/docs/:id` |
| `PATCH /api/content/docs/:id` | `PATCH /api/v1/content/docs/:id` |
| `DELETE /api/content/docs/:id` | `DELETE /api/v1/content/docs/:id` |
| `POST /api/content/docs/:id/collaborators` | `POST /api/v1/content/docs/:id/collaborators` |
| `DELETE /api/content/docs/:id/collaborators/:uid` | `DELETE /api/v1/content/docs/:id/collaborators/:uid` |
| `GET /api/users/search` | `GET /api/v1/users/search` |
| — | `POST /api/v1/auth/signup` |
| — | `POST /api/v1/auth/login` |
| — | `POST /api/v1/auth/logout` |
| — | `GET /api/v1/auth/me` |

---

## Backend

### JWT (`app/utils/token.py`)

- Algorithm: HS256, signed with `SECRET_KEY` env var
- Expiry: 7 days
- Payload: `{ sub, email, org_id, jti (UUID), iat, exp }`
- `create_token(user_id, email, org_id) → str`
- `decode_token(token) → dict` — raises `jwt.PyJWTError` on invalid/expired

### Auth Middleware (`app/middleware/auth.py`)

- Reads token from `Cookie: token` first, falls back to `Authorization: Bearer`
- Decodes JWT; on `PyJWTError` → sets empty user, continues (route dependency raises 401)
- Calls OPA `POST /v1/data/jwt/allow` with `{"input": {"jti": "..."}}` — if revoked → empty user
- OPA unavailable → fail open on revocation (token treated as valid; avoids availability crisis)
- Populates `request.state.user = User(id, email, org_id)`

### Auth Endpoints (`app/routers/auth.py`)

| Endpoint | Behaviour |
|----------|-----------|
| `POST /api/v1/auth/signup` | Validates no duplicate email, bcrypt hash (12 rounds), inserts org + user, returns JWT cookie + `{id, email, name}` |
| `POST /api/v1/auth/login` | Fetches user with password hash, `bcrypt.checkpw`, returns JWT cookie + `{id, email, name}` |
| `POST /api/v1/auth/logout` | Decodes cookie to get `jti` + `exp`, PATCHes OPA revocation store, clears cookie |
| `GET /api/v1/auth/me` | Returns `{id, email, name, org_id}` from `request.state.user` — no DB call |

Cookie settings: `httponly=True`, `samesite="lax"`, `path="/"`, `max_age=604800`

### DB Layer (`app/db/users.py`)

New methods alongside existing `get_user_by_email`:
- `get_user_for_auth(email) → dict | None` — includes `password_hash`, `org_id`
- `create_org(name) → str` — returns org id
- `create_user(email, password_hash, name, org_id) → str` — returns user id

### DB Schema (`app/migrations/init.sql`)

Replace `user_profiles` table and `CREATE DATABASE zitadel` with:

```sql
CREATE TABLE IF NOT EXISTS orgs (
    id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name       TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL DEFAULT '',
    org_id        TEXT NOT NULL REFERENCES orgs(id),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

All FK references to `user_profiles(zitadel_user_id)` → `users(id)`.

### OPA Policies

`policies/authz.rego` (new):
```rego
package authz
default allow = false
allow if input.role == "owner"
allow if { input.role == "editor"; input.action in {"read", "write"} }
allow if { input.role == "viewer"; input.action == "read" }
```

`policies/jwt.rego` — unchanged (revocation store already exists).

### OPA Middleware (`app/middleware/opa.py`)

`authorize(role, action)` — called by doc endpoints. POSTs to `POST /v1/data/authz/allow` with `{role, action}`. Raises 403 if denied.

### Dependencies

Add to `requirements.txt`: `PyJWT>=2.9.0`, `bcrypt>=4.0.0`

---

## Frontend

### Removed

- Packages: `next-auth`, `bcryptjs`, `@types/bcryptjs`, `pg`, `@types/pg`
- Files: `src/lib/auth.ts`, `src/types/next-auth.d.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/org/route.ts`
- Directories: `apps/zitadel-init/`, `docker-proxy/`, `traefik/`

### Proxy (`src/app/api/backend/[...path]/route.ts`)

Remove NextAuth token extraction and header injection. Forward `Cookie` header to backend. Pass `Set-Cookie` from backend response back to browser. All other logic unchanged.

### Middleware (`src/proxy.ts`)

Replace `withAuth` from next-auth with:
```ts
export function middleware(req: NextRequest) {
  if (!req.cookies.get("token")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}
```
Matcher excludes: `api/*`, `_next/*`, `favicon.ico`, `login`, `signup`.

### Providers (`src/app/providers.tsx`)

Remove `SessionProvider` wrapper. Keep MUI theme providers.

### `useCurrentUser` hook (`src/hooks/useCurrentUser.ts`)

Calls `GET /api/v1/auth/me` once on mount. Returns `{ id, email, name, orgId } | null`. On 401 (expired or revoked token that passed the middleware cookie-presence check), redirects to `/login`. Used anywhere the app needs to know who's logged in.

### Login page (`src/app/(auth)/login/page.tsx`)

Replace `signIn("credentials", ...)` with direct `POST /api/v1/auth/login`. On success cookie is set by the response; redirect to `/`.

### Signup page (`src/app/(auth)/signup/page.tsx`)

Replace `/api/org` fetch with `POST /api/v1/auth/signup`.

### Header (`src/components/layout/Header.tsx`)

Replace `signOut()` with:
```ts
await fetch("/api/backend/api/v1/auth/logout", { method: "POST" });
window.location.href = "/login";
```

### API client (`src/lib/api.ts`)

Update all path strings from `/api/...` to `/api/v1/...`.

---

## Config

### `.env.example`

Remove all `ZITADEL_*` vars. Add `SECRET_KEY=generate-with-openssl-rand-base64-32`.

### `docker-compose.yml`

- Remove services: `zitadel`, `zitadel-init`, `traefik`, `docker-proxy`
- Remove volume: `zitadel_machinekey`
- Remove network: `traefik-proxy`
- `research-api`: add `SECRET_KEY=${SECRET_KEY}` to environment
- `web`: remove `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`, `OPA_URL` (backend concerns now)

---

## Commit Plan

| # | Message | Scope |
|---|---------|-------|
| 1 | `add JWT token utility` | `app/utils/token.py`, `requirements.txt` |
| 2 | `replace header-based auth with JWT cookie middleware` | `app/middleware/auth.py` |
| 3 | `add user and org write methods to db layer` | `app/db/users.py` |
| 4 | `add auth endpoints: signup, login, logout, me` | `app/routers/auth.py` |
| 5 | `version all API routes under /api/v1` | `app/main.py`, all routers |
| 6 | `add OPA doc authz policy and wire into docs router` | `policies/authz.rego`, `app/middleware/opa.py`, `app/routers/docs.py` |
| 7 | `replace Zitadel schema with orgs and users tables` | `app/migrations/init.sql` |
| 8 | `update backend tests for new routes and schema` | `tests/test_docs_router.py` |
| 9 | `remove Zitadel and Traefik service directories` | `apps/zitadel-init/`, `docker-proxy/`, `traefik/` |
| 10 | `remove NextAuth: update proxy, middleware, providers` | proxy, `src/proxy.ts`, `providers.tsx`, deleted files, `package.json` |
| 11 | `replace NextAuth login/signup with backend auth calls` | `login/page.tsx`, `signup/page.tsx`, `lib/api.ts` |
| 12 | `add useCurrentUser hook, update Header sign-out` | `useCurrentUser.ts`, `Header.tsx` |
| 13 | `update env and docker config` | `.env.example`, `docker-compose.yml` |
