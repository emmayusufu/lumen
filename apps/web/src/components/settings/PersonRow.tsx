"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import type { CollaboratorSummary } from "@/lib/types";

interface Props {
  person: CollaboratorSummary;
  onRemoveFromDoc: (docId: string) => Promise<void>;
  onRemoveFromAll: () => Promise<void>;
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

export function PersonRow({ person, onRemoveFromDoc, onRemoveFromAll }: Props) {
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
          {person.docs.map((d) => (
            <Box
              key={d.doc_id}
              sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.625 }}
            >
              <Typography sx={{ fontSize: "0.84rem", flex: 1, minWidth: 0 }} noWrap>
                {d.doc_title}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "text.disabled",
                }}
              >
                {d.role}
              </Typography>
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
