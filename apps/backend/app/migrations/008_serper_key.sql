ALTER TABLE user_credentials ADD COLUMN IF NOT EXISTS serper_key_enc TEXT;
ALTER TABLE workspace_credentials ADD COLUMN IF NOT EXISTS serper_key_enc TEXT;
