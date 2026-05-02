"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import { CollaboratorList } from "./CollaboratorList";
import type { DocCollaborator, DocCollaboratorRole } from "@/lib/types";

interface Props {
  collaborators: DocCollaborator[];
  isOwner: boolean;
  visibility: "private" | "workspace";
  onAdd: (email: string, role: DocCollaboratorRole) => Promise<void>;
  onUpdateRole: (userId: string, role: DocCollaboratorRole) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
  onUpdateVisibility: (visibility: "private" | "workspace") => Promise<void>;
}

export function ShareButton({
  collaborators,
  isOwner,
  visibility,
  onAdd,
  onUpdateRole,
  onRemove,
  onUpdateVisibility,
}: Props) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={
          <PeopleOutlineRoundedIcon sx={{ fontSize: "14px !important" }} />
        }
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          display: { xs: "none", sm: "inline-flex" },
          borderColor: "divider",
          color: "text.secondary",
          "&:hover": { borderColor: "text.disabled", color: "text.primary" },
        }}
      >
        Share
      </Button>
      <IconButton
        size="small"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          display: { xs: "inline-flex", sm: "none" },
          width: 32,
          height: 32,
          color: "text.secondary",
          opacity: 0.75,
          "&:hover": { color: "text.primary", backgroundColor: "transparent" },
        }}
      >
        <PeopleOutlineRoundedIcon sx={{ fontSize: 16 }} />
      </IconButton>
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
              width: { xs: "calc(100vw - 24px)", sm: 360 },
              maxWidth: 360,
              borderRadius: "10px",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
              backgroundColor: "#EEE8D8",
              ...theme.applyStyles("dark", { backgroundColor: "#121006" }),
            }),
          },
        }}
      >
        <CollaboratorList
          collaborators={collaborators}
          isOwner={isOwner}
          visibility={visibility}
          onAdd={onAdd}
          onUpdateRole={onUpdateRole}
          onRemove={onRemove}
          onUpdateVisibility={onUpdateVisibility}
        />
      </Popover>
    </>
  );
}
