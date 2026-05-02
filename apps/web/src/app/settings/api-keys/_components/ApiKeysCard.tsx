"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { FormInput } from "@repo/ui";
import type { CredentialInfo } from "@/lib/types";

interface Props {
  title: string;
  description: string;
  info: CredentialInfo;
  disabled?: boolean;
  disabledReason?: string;
  placeholder?: string;
  onSave: (apiKey: string) => Promise<void>;
  onRemove: () => Promise<void>;
  saving: boolean;
}

export function ApiKeysCard({
  title,
  description,
  info,
  disabled,
  disabledReason,
  placeholder = "sk-abcd1234…",
  onSave,
  onRemove,
  saving,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  const handleSave = async () => {
    if (!value.trim()) return;
    await onSave(value.trim());
    setValue("");
    setEditing(false);
  };

  const showEditor = editing || !info.configured;

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: "10px",
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <Typography sx={{ fontSize: "1rem", fontWeight: 700, mb: 0.5 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", mb: 2 }}>
        {description}
      </Typography>

      {disabled && disabledReason && (
        <Typography
          sx={{
            fontSize: "0.78rem",
            color: "text.disabled",
            fontStyle: "italic",
          }}
        >
          {disabledReason}
        </Typography>
      )}

      {!disabled && info.configured && !editing && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography
            sx={{
              fontFamily: "'SF Mono', 'JetBrains Mono', monospace",
              fontSize: "0.82rem",
              fontWeight: 600,
            }}
          >
            sk-…{info.last_four}
          </Typography>
          <Typography sx={{ fontSize: "0.76rem", color: "text.disabled" }}>
            Updated{" "}
            {info.updated_at
              ? new Date(info.updated_at).toLocaleDateString()
              : "—"}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            variant="outlined"
            onClick={() => setEditing(true)}
            sx={{ fontSize: "0.76rem" }}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={onRemove}
            disabled={saving}
            sx={{ fontSize: "0.76rem", color: "error.main" }}
          >
            Remove
          </Button>
        </Box>
      )}

      {!disabled && showEditor && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            maxWidth: 520,
          }}
        >
          <FormInput
            label="API key"
            placeholder={placeholder}
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!value.trim() || saving}
              sx={{ boxShadow: "none", "&:hover": { boxShadow: "none" } }}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            {editing && (
              <Button
                variant="text"
                onClick={() => {
                  setEditing(false);
                  setValue("");
                }}
              >
                Cancel
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
