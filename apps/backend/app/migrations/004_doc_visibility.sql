\c app

ALTER TABLE docs ADD COLUMN IF NOT EXISTS org_id TEXT REFERENCES orgs(id);
ALTER TABLE docs ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'org'));

UPDATE docs d SET org_id = u.org_id FROM users u WHERE d.owner_id = u.id AND d.org_id IS NULL;

ALTER TABLE docs ALTER COLUMN org_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS docs_org_visibility_idx ON docs(org_id, visibility);
