\c app

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
UPDATE users SET is_admin = true WHERE is_admin = false;

CREATE TABLE IF NOT EXISTS user_credentials (
    user_id          TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    deepseek_key_enc TEXT NOT NULL,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_credentials (
    org_id           TEXT PRIMARY KEY REFERENCES orgs(id) ON DELETE CASCADE,
    deepseek_key_enc TEXT NOT NULL,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
