ALTER TABLE docs ADD COLUMN parent_id UUID REFERENCES docs(id) ON DELETE CASCADE;
ALTER TABLE docs ADD CONSTRAINT docs_no_self_parent CHECK (parent_id IS NULL OR parent_id != id);
CREATE INDEX docs_parent_id_idx ON docs(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX docs_workspace_parent_idx ON docs(workspace_id, parent_id);
