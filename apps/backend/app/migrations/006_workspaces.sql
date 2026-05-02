-- 006_workspaces.sql
-- Rename orgs → workspaces; introduce workspace_members and workspace_invites.
-- Single transaction (implicit via migrations.py runner).

CREATE TABLE workspaces (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    slug       TEXT NOT NULL UNIQUE,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO workspaces (id, name, slug, created_by, created_at)
SELECT
    o.id::uuid,
    o.name,
    LOWER(REGEXP_REPLACE(o.name, '[^a-zA-Z0-9]+', '-', 'g'))
        || '-' || SUBSTRING(MD5(o.id || RANDOM()::text), 1, 4) AS slug,
    (SELECT u.id FROM users u WHERE u.org_id = o.id ORDER BY u.created_at LIMIT 1),
    o.created_at
FROM orgs o;

CREATE TABLE workspace_members (
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
    role         TEXT NOT NULL CHECK (role IN ('admin','editor','viewer')),
    joined_at    TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);

INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT u.org_id::uuid, u.id, 'admin'
FROM users u;

CREATE INDEX workspace_members_user_id_idx ON workspace_members(user_id);

CREATE TABLE workspace_invites (
    token        TEXT PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    email        TEXT,
    role         TEXT NOT NULL CHECK (role IN ('admin','editor','viewer')),
    created_by   TEXT REFERENCES users(id),
    expires_at   TIMESTAMPTZ NOT NULL,
    accepted_at  TIMESTAMPTZ,
    accepted_by  TEXT REFERENCES users(id)
);

CREATE INDEX workspace_invites_workspace_id_idx ON workspace_invites(workspace_id);

ALTER TABLE docs ADD COLUMN workspace_id UUID REFERENCES workspaces(id);
UPDATE docs SET workspace_id = org_id::uuid;
ALTER TABLE docs ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE docs DROP COLUMN org_id;

UPDATE docs SET visibility = 'workspace' WHERE visibility = 'org';
ALTER TABLE docs DROP CONSTRAINT IF EXISTS docs_visibility_check;
ALTER TABLE docs ADD CONSTRAINT docs_visibility_check
    CHECK (visibility IN ('private','workspace'));

ALTER TABLE users DROP COLUMN org_id;

-- org_credentials keys on org_id (TEXT); rename table + column, cast to UUID, add FK.
ALTER TABLE org_credentials RENAME TO workspace_credentials;
ALTER TABLE workspace_credentials RENAME COLUMN org_id TO workspace_id;
ALTER TABLE workspace_credentials DROP CONSTRAINT IF EXISTS org_credentials_org_id_fkey;
ALTER TABLE workspace_credentials
    ALTER COLUMN workspace_id TYPE UUID USING workspace_id::uuid;
ALTER TABLE workspace_credentials
    ADD CONSTRAINT workspace_credentials_workspace_id_fkey
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

DROP TABLE orgs;

CREATE INDEX docs_workspace_id_idx ON docs(workspace_id);
