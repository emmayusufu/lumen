"use client";

import { useState, useRef, use, useEffect, useMemo } from "react";
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

function wordCount(html: string) {
  return html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function DocPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { doc, isSaving, saveTitle, saveContent, addCollaborator, updateCollaboratorRole, removeCollaborator, saveError, clearSaveError } = useDoc(id);
  const { docs, createDoc, refresh: refreshDocs } = useDocs();
  const [researchOpen, setResearchOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [liveContent, setLiveContent] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const words = useMemo(
    () => wordCount(liveContent ?? doc?.content ?? ""),
    [liveContent, doc?.content],
  );
  const readMins = words === 0 ? 0 : Math.max(1, Math.round(words / 220));

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    const newId = await createDoc();
    setCreating(false);
    router.push(`/docs/${newId}`);
  };

  if (!doc) return mounted ? (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <CircularProgress size={22} thickness={2} />
    </Box>
  ) : null;

  const canEdit = doc.role === "owner" || doc.role === "editor";

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <DocSidebar docs={docs} currentId={id} creating={creating} onCreate={handleCreate} />

      <Box
        sx={(theme) => ({
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          pt: { xs: 0.75, md: 1 },
          pr: { xs: 0.75, md: 1 },
          pb: { xs: 0.75, md: 1 },
          pl: { xs: 1.5, md: 2.5 },
          position: "relative",
          backgroundColor: "#EEE8D8",
          ...theme.applyStyles("dark", {
            backgroundColor: "#121006",
          }),
        })}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: "background.paper",
            borderRadius: "14px",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
        <Box
          className="lumen-fade"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 4,
            py: 2,
            flexShrink: 0,
            gap: 3,
            borderBottom: "1px solid",
            borderColor: "divider",
            animationDelay: "0.1s",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontSize: "0.78rem",
                fontWeight: 500,
                color: "text.secondary",
                textTransform: "capitalize",
                opacity: 0.75,
                flexShrink: 0,
              }}
            >
              {doc.role}
            </Typography>
            <Box
              sx={{
                width: "1px",
                height: 12,
                backgroundColor: "divider",
                flexShrink: 0,
              }}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.875, flexShrink: 0 }}>
              <Box
                className={isSaving ? "lumen-pulse" : ""}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: isSaving ? "secondary.main" : "primary.main",
                  opacity: isSaving ? 1 : 0.6,
                  transition: "background-color 0.3s",
                }}
              />
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  color: "text.secondary",
                  opacity: 0.75,
                }}
              >
                {isSaving ? "Saving…" : "Saved"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {canEdit && (
              <Tooltip title="Ask AI  ⌘K">
                <IconButton
                  size="small"
                  onClick={() => setResearchOpen(true)}
                  sx={{
                    width: 32,
                    height: 32,
                    color: "text.secondary",
                    opacity: 0.7,
                    transition: "all 0.2s",
                    "&:hover": { opacity: 1, color: "primary.main", backgroundColor: "transparent" },
                  }}
                >
                  <AutoAwesomeRoundedIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            )}
            <ShareButton
              collaborators={doc.collaborators}
              isOwner={doc.role === "owner"}
              onAdd={addCollaborator}
              onUpdateRole={updateCollaboratorRole}
              onRemove={removeCollaborator}
            />
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflow: "auto", position: "relative" }}>
          <Box
            className="lumen-rise"
            sx={{
              maxWidth: 760,
              mx: "auto",
              px: { xs: 2, md: 4 },
              pt: { xs: 8, md: 14 },
              pb: 24,
              animationDelay: "0.2s",
            }}
          >
            <Box
              className="lumen-fade"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 3.5,
                animationDelay: "0.25s",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  color: "text.secondary",
                  opacity: 0.75,
                }}
              >
                {formatDate(doc.updated_at)}
              </Typography>
              <Box sx={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "text.disabled", opacity: 0.5 }} />
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  color: "text.secondary",
                  opacity: 0.75,
                }}
              >
                {words.toLocaleString()} {words === 1 ? "word" : "words"}
              </Typography>
              {readMins > 0 && (
                <>
                  <Box sx={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "text.disabled", opacity: 0.5 }} />
                  <Typography
                    sx={{
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      color: "text.secondary",
                      opacity: 0.75,
                    }}
                  >
                    {readMins} min read
                  </Typography>
                </>
              )}
            </Box>

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
                fontFamily: "inherit",
                fontSize: { xs: "2.25rem", md: "2.85rem" },
                fontWeight: 800,
                letterSpacing: "-0.035em",
                lineHeight: 1.08,
                border: "none",
                outline: "none",
                bgcolor: "transparent",
                color: "text.primary",
                mb: 2.5,
                p: 0,
                "::placeholder": {
                  color: "text.disabled",
                  opacity: 0.5,
                },
              }}
            />

            <Box
              className="lumen-draw-line"
              sx={{
                width: 56,
                height: "1.5px",
                backgroundColor: "primary.main",
                opacity: 0.7,
                mb: 5,
                animationDelay: "0.45s",
              }}
            />

            <DocEditor
              docId={id}
              content={doc.content}
              readOnly={!canEdit}
              onContentSave={saveContent}
              onContentChange={setLiveContent}
              onAskAI={canEdit ? () => setResearchOpen(true) : undefined}
            />
          </Box>
        </Box>
        </Box>
      </Box>

      <DocResearchPanel open={researchOpen} onClose={() => setResearchOpen(false)} />
      <Snackbar open={!!saveError} message={saveError} autoHideDuration={3000} onClose={clearSaveError} />
    </Box>
  );
}
