"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Popover from "@mui/material/Popover";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import { CollaboratorList } from "./CollaboratorList";
import type { DocCollaborator } from "@/lib/types";

interface Props {
  collaborators: DocCollaborator[];
  isOwner: boolean;
  onAdd: (email: string, role: "editor" | "viewer") => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}

export function ShareButton({ collaborators, isOwner, onAdd, onRemove }: Props) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={<PeopleOutlineRoundedIcon sx={{ fontSize: "14px !important" }} />}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          fontSize: "0.78rem",
          fontWeight: 600,
          borderRadius: "6px",
          px: 1.5,
          py: 0.5,
          borderColor: "divider",
          color: "text.secondary",
          "&:hover": { borderColor: "text.disabled", color: "text.primary" },
        }}
      >
        Share
      </Button>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: (theme) => ({
              mt: 0.75,
              p: 2,
              width: 360,
              borderRadius: "10px",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              ...theme.applyStyles("dark", {
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }),
            }),
          },
        }}
      >
        <CollaboratorList
          collaborators={collaborators}
          isOwner={isOwner}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      </Popover>
    </>
  );
}
