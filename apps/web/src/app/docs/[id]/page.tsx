"use client";

import { useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { DocEditor } from "@/components/docs/DocEditor";
import { DocResearchPanel } from "@/components/docs/DocResearchPanel";
import { DocSidebar } from "@/components/docs/DocSidebar";
import { ShareButton } from "@/components/docs/ShareButton";
import { useDoc } from "@/hooks/useDoc";
import { useDocs } from "@/hooks/useDocs";

interface Props {
  params: Promise<{ id: string }>;
}

export default function DocPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { doc, saveTitle, saveContent, addCollaborator, removeCollaborator, saveError, clearSaveError } = useDoc(id);
  const { docs, createDoc, refresh: refreshDocs } = useDocs();
  const [researchOpen, setResearchOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    const newId = await createDoc();
    setCreating(false);
    router.push(`/docs/${newId}`);
  };

  if (!doc) return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <CircularProgress size={24} thickness={2} />
    </Box>
  );

  const canEdit = doc.role === "owner" || doc.role === "editor";

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <DocSidebar docs={docs} currentId={id} creating={creating} onCreate={handleCreate} />

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "background.paper" }}>
        {/* Top bar */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            px: 3,
            minHeight: 44,
            borderBottom: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          {/* Left — empty spacer */}
          <Box />

          {/* Center — current doc title */}
          <Typography
            noWrap
            sx={{
              fontSize: "0.78rem",
              fontWeight: 500,
              color: "text.disabled",
              letterSpacing: "-0.01em",
              maxWidth: 300,
              textAlign: "center",
            }}
          >
            {doc.title || "Untitled"}
          </Typography>

          {/* Right — actions */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.75 }}>
            {canEdit && (
              <Tooltip title="Ask AI  ⌘K">
                <IconButton
                  size="small"
                  onClick={() => setResearchOpen(true)}
                  sx={{ color: "text.disabled", "&:hover": { color: "primary.main" }, transition: "color 0.15s" }}
                >
                  <AutoAwesomeRoundedIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            )}
            <ShareButton
              collaborators={doc.collaborators}
              isOwner={doc.role === "owner"}
              onAdd={addCollaborator}
              onRemove={removeCollaborator}
            />
          </Box>
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            background: (t) =>
              t.palette.mode === "dark"
                ? "#212121"
                : "linear-gradient(180deg, #EEF0E9 0%, #ffffff 90px)",
          }}
        >
          <Box sx={{ maxWidth: 720, mx: "auto", px: { xs: 3, md: 8 }, pt: 12, pb: 24 }}>
            <Box
              component="input"
              ref={titleRef}
              defaultValue={doc.title}
              readOnly={!canEdit}
              placeholder="Untitled"
              onBlur={() => {
                const val = titleRef.current?.value ?? "";
                if (canEdit && val !== doc.title)
                  void saveTitle(val).then(() => void refreshDocs());
              }}
              sx={{
                display: "block",
                width: "100%",
                fontSize: "2.25rem",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1.15,
                border: "none",
                outline: "none",
                bgcolor: "transparent",
                color: "text.primary",
                fontFamily: "inherit",
                mb: 1,
                p: 0,
                "::placeholder": { color: "text.disabled" },
              }}
            />
            <DocEditor
              content={doc.content}
              readOnly={!canEdit}
              onContentSave={saveContent}
              onAskAI={canEdit ? () => setResearchOpen(true) : undefined}
            />
          </Box>
        </Box>
      </Box>

      <DocResearchPanel open={researchOpen} onClose={() => setResearchOpen(false)} />
      <Snackbar open={!!saveError} message={saveError} autoHideDuration={3000} onClose={clearSaveError} />
    </Box>
  );
}
