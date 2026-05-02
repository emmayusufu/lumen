\c app

CREATE TABLE IF NOT EXISTS doc_yjs_state (
  doc_id UUID PRIMARY KEY REFERENCES docs(id) ON DELETE CASCADE,
  state   BYTEA        NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
