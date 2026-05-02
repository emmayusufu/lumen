\c app

CREATE TABLE IF NOT EXISTS comment_threads (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id     UUID NOT NULL REFERENCES docs(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL REFERENCES users(id),
    resolved   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comment_messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id  UUID NOT NULL REFERENCES comment_threads(id) ON DELETE CASCADE,
    author_id  TEXT NOT NULL REFERENCES users(id),
    body       TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comment_threads_doc_id_idx ON comment_threads(doc_id);
CREATE INDEX IF NOT EXISTS comment_messages_thread_id_idx ON comment_messages(thread_id);
