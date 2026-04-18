"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import type { CollaboratorSummary } from "@/lib/types";

interface Props {
  person: CollaboratorSummary;
  onRemoveFromDoc: (docId: string) => Promise<void>;
  onRemoveFromAll: () => Promise<void>;
  onUpdateRole: (docId: string, role: "editor" | "viewer") => Promise<void>;
}

function roleSummary(roles: string[]): string {
  const counts: Record<string, number> = {};
  for (const r of roles) counts[r] = (counts[r] ?? 0) + 1;
  const parts: string[] = [];
  if (counts.editor)
    parts.push(`editor on ${counts.editor} doc${counts.editor === 1 ? "" : "s"}`);
  if (counts.viewer)
    parts.push(`viewer on ${counts.viewer} doc${counts.viewer === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

export function PersonRow({ person, onRemoveFromDoc, onRemoveFromAll, onUpdateRole }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleBulk = async () => {
    setRemoving(true);
    try {
      await onRemoveFromAll();
    } finally {
      setRemoving(false);
      setConfirmBulk(false);
    }
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "background.paper",
      }}
    >
      <Box
        onClick={() => setOpen(!open)}
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1.5,
          cursor: "pointer",
          "&:hover": { backgroundColor: "rgba(139, 155, 110, 0.06)" },
          ...theme.applyStyles("dark", {
            "&:hover": { backgroundColor: "rgba(186, 200, 160, 0.06)" },
          }),
        })}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: "0.88rem", fontWeight: 600 }}>
            {person.display_name || person.email}
          </Typography>
          <Typography noWrap sx={{ fontSize: "0.76rem", color: "text.secondary" }}>
            {person.email}
          </Typography>
          <Typography sx={{ fontSize: "0.74rem", color: "text.disabled", mt: 0.25 }}>
            {roleSummary(person.roles)}
          </Typography>
        </Box>
        <IconButton
          size="small"
          sx={{
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.15s",
          }}
        >
          <ExpandMoreRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {open && (
        <Box sx={{ px: 2, py: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
          <Typography
            sx={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "text.disabled",
              mb: 1,
            }}
          >
            Docs
          </Typography>
          {person.docs.map((d, i) => (
            <Box
              key={d.doc_id ?? i}
              sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.625 }}
            >
              <Typography sx={{ fontSize: "0.84rem", flex: 1, minWidth: 0 }} noWrap>
                {d.doc_title}
              </Typography>
              <Select
                size="small"
                value={d.role}
                onChange={(e) => {
                  e.stopPropagation();
                  void onUpdateRole(d.doc_id, e.target.value as "editor" | "viewer");
                }}
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
                      ...theme.applyStyles("dark", { backgroundColor: "#121006" }),
                      "& .MuiMenuItem-root": {
                        borderRadius: "6px",
                        mx: "4px",
                        width: "calc(100% - 8px)",
                      },
                      "& .MuiMenuItem-root.Mui-selected": { backgroundColor: "transparent" },
                      "& .MuiMenuItem-root.Mui-selected:hover": { backgroundColor: "action.hover" },
                    }),
                  },
                }}
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  height: 28,
                  minWidth: 80,
                  flexShrink: 0,
                  color: "text.disabled",
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  "& .MuiSelect-select": { py: 0, pl: 0.5, pr: "32px !important" },
                }}
              >
                {(["editor", "viewer"] as const).map((val) => (
                  <MenuItem key={val} value={val}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, width: "100%" }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{val === "editor" ? "Editor" : "Viewer"}</Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
                          {val === "editor" ? "Can edit and comment" : "Read-only access"}
                        </Typography>
                      </Box>
                      {d.role === val && <DoneAllRoundedIcon sx={{ fontSize: 15, color: "primary.main", mt: 0.3, flexShrink: 0 }} />}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <IconButton
                size="small"
                onClick={async (e) => {
                  e.stopPropagation();
                  await onRemoveFromDoc(d.doc_id);
                }}
                sx={{
                  color: "text.disabled",
                  "&:hover": { color: "error.main" },
                }}
              >
                <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Box>
          ))}

          <Box sx={{ mt: 2, borderTop: "1px solid", borderColor: "divider", pt: 1.5 }}>
            {!confirmBulk ? (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setConfirmBulk(true)}
                sx={{ fontSize: "0.76rem" }}
              >
                Remove from all my docs
              </Button>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
                <Typography sx={{ fontSize: "0.82rem" }}>
                  Remove {person.display_name || person.email} from all {person.doc_count} doc
                  {person.doc_count === 1 ? "" : "s"}?
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  disabled={removing}
                  onClick={handleBulk}
                  sx={{ boxShadow: "none", fontSize: "0.76rem" }}
                >
                  {removing ? "Removing…" : "Confirm"}
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setConfirmBulk(false)}
                  sx={{ fontSize: "0.76rem" }}
                >
                  Cancel
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
