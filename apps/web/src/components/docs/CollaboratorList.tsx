"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import { FormInput } from "@/components/shared/FormInput";
import { FormSelect } from "@/components/shared/FormSelect";
import type { DocCollaborator } from "@/lib/types";

interface CollaboratorListProps {
  collaborators: DocCollaborator[];
  isOwner: boolean;
  onAdd: (email: string, role: "editor" | "viewer") => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}

export function CollaboratorList({ collaborators, isOwner, onAdd, onRemove }: CollaboratorListProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    setError(null);
    try {
      await onAdd(email.trim(), role);
      setEmail("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add collaborator");
    }
  };

  return (
    <Box>
      <Typography
        sx={{
          fontSize: "0.56rem",
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "text.secondary",
          opacity: 0.65,
          mb: 1.25,
        }}
      >
        Collaborators
      </Typography>
      <List dense disablePadding sx={{ mb: 2 }}>
        {collaborators.map((c) => (
          <ListItem
            key={c.user_id}
            disableGutters
            sx={{
              py: 0.75,
              borderBottom: "1px solid",
              borderColor: "divider",
              "&:last-of-type": { borderBottom: "none" },
            }}
            secondaryAction={
              isOwner && (
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => onRemove(c.user_id)}
                  sx={{
                    color: "text.secondary",
                    opacity: 0.6,
                    "&:hover": { opacity: 1, color: "error.main" },
                  }}
                >
                  <PersonRemoveRoundedIcon sx={{ fontSize: 15 }} />
                </IconButton>
              )
            }
          >
            <ListItemText
              primary={c.display_name ?? c.email ?? c.user_id}
              secondary={c.role}
              primaryTypographyProps={{
                fontSize: "0.85rem",
                fontWeight: 600,
                letterSpacing: "-0.005em",
              }}
              secondaryTypographyProps={{
                fontSize: "0.68rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                sx: { opacity: 0.6 },
              }}
            />
          </ListItem>
        ))}
      </List>
      {isOwner && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
          <FormInput
            label="Add by email"
            placeholder="colleague@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!error}
            errorText={error ?? undefined}
          />
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            <Box sx={{ flex: 1 }}>
              <FormSelect
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
              >
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="viewer">Viewer</MenuItem>
              </FormSelect>
            </Box>
            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={!email.trim()}
              sx={{
                height: 43,
                minWidth: 92,
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.02em",
                boxShadow: "none",
                "&:hover": { boxShadow: "none" },
              }}
            >
              Invite
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
