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
import { FormInput } from "@/components/shared/FormInput";
import { FormSelect } from "@/components/shared/FormSelect";
import type { DocCollaborator } from "@/lib/types";

interface CollaboratorListProps {
  collaborators: DocCollaborator[];
  isOwner: boolean;
  onAdd: (email: string, role: "editor" | "viewer") => Promise<void>;
  onUpdateRole: (userId: string, role: "editor" | "viewer") => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}

export function CollaboratorList({
  collaborators,
  isOwner,
  onAdd,
  onUpdateRole,
  onRemove,
}: CollaboratorListProps) {
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
          fontSize: "0.78rem",
          fontWeight: 600,
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
                  onUpdateRole(c.user_id, e.target.value as "editor" | "viewer")
                }
                onClick={(e) => e.stopPropagation()}
                renderValue={(val) => (val === "editor" ? "Editor" : "Viewer")}
                MenuProps={{
                  PaperProps: {
                    sx: (theme) => ({
                      boxShadow: "none",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: "8px",
                      minWidth: "190px !important",
                      py: 0.5,
                      backgroundColor: "#EEE8D8",
                      ...theme.applyStyles("dark", {
                        backgroundColor: "#121006",
                      }),
                      "& .MuiMenuItem-root": {
                        borderRadius: "6px",
                        mx: "4px",
                        width: "calc(100% - 8px)",
                      },
                      "& .MuiMenuItem-root.Mui-selected": {
                        backgroundColor: "transparent",
                      },
                      "& .MuiMenuItem-root.Mui-selected:hover": {
                        backgroundColor: "action.hover",
                      },
                    }),
                  },
                }}
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
            >
              Invite
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
