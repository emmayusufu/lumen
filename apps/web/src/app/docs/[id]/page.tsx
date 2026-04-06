"use client";

import { useState, useRef, use } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import { Header } from "@/components/layout/Header";
import { CollaboratorList } from "@/components/docs/CollaboratorList";
import { DocEditor } from "@/components/docs/DocEditor";
import { DocResearchPanel } from "@/components/docs/DocResearchPanel";
import { useDoc } from "@/hooks/useDoc";
import type { DocDetail } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

interface DocBodyProps {
  doc: DocDetail;
  saveTitle: (title: string) => Promise<void>;
  saveContent: (content: string) => Promise<void>;
  addCollaborator: (email: string, role: "editor" | "viewer") => Promise<void>;
  removeCollaborator: (userId: string) => Promise<void>;
}

function DocBody({ doc, saveTitle, saveContent, addCollaborator, removeCollaborator }: DocBodyProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const canEdit = doc.role === "owner" || doc.role === "editor";

  const handleTitleBlur = () => {
    const val = titleRef.current?.value ?? "";
    if (canEdit && val !== doc.title) void saveTitle(val);
  };

  return (
    <Box sx={{ flex: 1, overflow: "auto", p: 3, maxWidth: 860, mx: "auto", width: "100%" }}>
      <Box
        component="input"
        ref={titleRef}
        defaultValue={doc.title}
        readOnly={!canEdit}
        onBlur={handleTitleBlur}
        sx={{
          width: "100%",
          fontSize: 28,
          fontWeight: 700,
          border: "none",
          outline: "none",
          bgcolor: "transparent",
          color: "text.primary",
          mb: 3,
          p: 0,
        }}
      />
      <DocEditor content={doc.content} readOnly={!canEdit} onContentSave={saveContent} />
      <Box sx={{ mt: 4 }}>
        <CollaboratorList
          collaborators={doc.collaborators}
          isOwner={doc.role === "owner"}
          onAdd={addCollaborator}
          onRemove={removeCollaborator}
        />
      </Box>
    </Box>
  );
}

export default function DocPage({ params }: Props) {
  const { id } = use(params);
  const { doc, saveTitle, saveContent, addCollaborator, removeCollaborator, saveError, clearSaveError } =
    useDoc(id);
  const [researchOpen, setResearchOpen] = useState(false);

  if (!doc)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box
      sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}
    >
      <Header />
      <Box sx={{ height: 56 }} />
      <DocBody
        key={doc.id}
        doc={doc}
        saveTitle={saveTitle}
        saveContent={saveContent}
        addCollaborator={addCollaborator}
        removeCollaborator={removeCollaborator}
      />
      <Tooltip title="Research assistant">
        <IconButton
          onClick={() => setResearchOpen(true)}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            bgcolor: "primary.main",
            color: "white",
            "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          <ScienceRoundedIcon />
        </IconButton>
      </Tooltip>
      <DocResearchPanel open={researchOpen} onClose={() => setResearchOpen(false)} />
      <Snackbar
        open={!!saveError}
        message={saveError}
        autoHideDuration={3000}
        onClose={clearSaveError}
      />
    </Box>
  );
}
