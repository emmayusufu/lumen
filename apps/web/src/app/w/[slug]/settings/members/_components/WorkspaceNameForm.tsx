"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { FormInput } from "@repo/ui";
import { fetchWorkspaces, renameWorkspace } from "@/lib/api";

interface Props {
  slug: string;
}

export function WorkspaceNameForm({ slug }: Props) {
  const [current, setCurrent] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspaces()
      .then((list) => {
        const match = list.find((w) => w.slug === slug);
        if (match) {
          setCurrent(match.name);
          setValue(match.name);
        }
      })
      .catch((e) => setError((e as Error).message));
  }, [slug]);

  const dirty =
    current !== null && value.trim() !== current && value.trim().length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await renameWorkspace(slug, value.trim());
      setCurrent(value.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={onSubmit}>
      <FormInput
        label="Workspace name"
        placeholder="e.g. Acme, Side Project"
        helperText={`URL slug stays /w/${slug} — renaming won't break existing links.`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={!!error}
        errorText={error ?? undefined}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1.5 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={!dirty || saving}
          sx={{ boxShadow: "none", "&:hover": { boxShadow: "none" } }}
        >
          {saving ? "Saving…" : "Save name"}
        </Button>
        {saved && (
          <Typography sx={{ fontSize: "0.82rem", color: "primary.main" }}>
            Saved.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
