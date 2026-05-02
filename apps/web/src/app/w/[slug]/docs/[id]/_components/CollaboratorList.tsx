"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import { FormInput, FormSelect, menuPaperSx } from "@repo/ui";
import type { DocCollaborator, DocCollaboratorRole } from "@/lib/types";

interface CollaboratorListProps {
  collaborators: DocCollaborator[];
  isOwner: boolean;
  visibility: "private" | "workspace";
  onAdd: (email: string, role: DocCollaboratorRole) => Promise<void>;
  onUpdateRole: (userId: string, role: DocCollaboratorRole) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
  onUpdateVisibility: (visibility: "private" | "workspace") => Promise<void>;
}

export function CollaboratorList({
  collaborators,
  isOwner,
  visibility,
  onAdd,
  onUpdateRole,
  onRemove,
  onUpdateVisibility,
}: CollaboratorListProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<DocCollaboratorRole>("editor");
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
      <Box
        sx={{
          mb: 2,
          pb: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {isOwner ? (
          <FormSelect
            label="General access"
            value={visibility}
            onChange={(e) =>
              void onUpdateVisibility(e.target.value as "private" | "workspace")
            }
          >
            <MenuItem value="workspace">
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
                  Anyone in your workspace
                </Typography>
                <Typography
                  sx={{ fontSize: "0.72rem", color: "text.secondary" }}
                >
                  Your whole workspace can view and edit
                </Typography>
              </Box>
            </MenuItem>
            <MenuItem value="private">
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
                  Private
                </Typography>
                <Typography
                  sx={{ fontSize: "0.72rem", color: "text.secondary" }}
                >
                  Only people invited below
                </Typography>
              </Box>
            </MenuItem>
          </FormSelect>
        ) : (
          <>
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 500,
                color: "text.secondary",
                mb: 0.5,
              }}
            >
              General access
            </Typography>
            <Typography
              sx={{
                fontSize: "0.82rem",
                fontWeight: 500,
                color: "text.secondary",
              }}
            >
              {visibility === "workspace"
                ? "Anyone in your workspace"
                : "Private"}
            </Typography>
          </>
        )}
      </Box>
      <Typography
        sx={{
          fontSize: "0.78rem",
          fontWeight: 600,
          color: "text.secondary",
          opacity: 0.65,
          mb: 1.25,
        }}
      >
        Collaborators
      </Typography>
      <List
        dense
        disablePadding
        sx={{
          mb: 2,
          maxHeight: 180,
          overflowY: "auto",
          pr: 0.5,
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "divider",
            borderRadius: 3,
          },
        }}
      >
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
              primaryTypographyProps={{
                fontSize: "0.85rem",
                fontWeight: 600,
                letterSpacing: "-0.005em",
              }}
            />
            {isOwner ? (
              <Select
                size="small"
                value={c.role}
                onChange={(e) =>
                  onUpdateRole(c.user_id, e.target.value as DocCollaboratorRole)
                }
                onClick={(e) => e.stopPropagation()}
                renderValue={(val) => (val === "editor" ? "Editor" : "Viewer")}
                MenuProps={{ slotProps: { paper: { sx: menuPaperSx } } }}
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  height: 28,
                  minWidth: 80,
                  flexShrink: 0,
                  mr: isOwner ? 4 : 0,
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  "& .MuiSelect-select": {
                    py: 0,
                    pl: 0.5,
                    pr: "32px !important",
                  },
                  color: "text.secondary",
                }}
              >
                {(["editor", "viewer"] as const).map((val) => (
                  <MenuItem key={val} value={val}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                        width: "100%",
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{ fontSize: "0.82rem", fontWeight: 600 }}
                        >
                          {val === "editor" ? "Editor" : "Viewer"}
                        </Typography>
                        <Typography
                          sx={{ fontSize: "0.72rem", color: "text.secondary" }}
                        >
                          {val === "editor"
                            ? "Can edit and comment"
                            : "Read-only access"}
                        </Typography>
                      </Box>
                      {c.role === val && (
                        <DoneAllRoundedIcon
                          sx={{
                            fontSize: 15,
                            color: "primary.main",
                            mt: 0.3,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            ) : (
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  opacity: 0.55,
                  mr: 1,
                }}
              >
                {c.role === "editor" ? "Editor" : "Viewer"}
              </Typography>
            )}
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
                onChange={(e) => setRole(e.target.value as DocCollaboratorRole)}
              >
                <MenuItem value="editor">Editor</MenuItem>
                <MenuItem value="viewer">Viewer</MenuItem>
              </FormSelect>
            </Box>
            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={!email.trim()}
            >
              Invite
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
