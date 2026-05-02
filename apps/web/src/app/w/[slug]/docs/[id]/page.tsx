"use client";

import {
  useState,
  useRef,
  useCallback,
  use,
  useEffect,
  useSyncExternalStore,
} from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { CommentsPanel } from "./_components/CommentsPanel";
import { SummaryPanel } from "./_components/SummaryPanel";
import { DocTour } from "./_components/DocTour";
import { streamFactCheck } from "@/lib/api";
import type { FactCheckVerdict } from "./_components/editor/factCheckDecorations";
import { DocEditor } from "./_components/DocEditor";
import { DocMenu } from "./_components/DocMenu";
import { PresenceAvatars } from "./_components/PresenceAvatars";
import { ShareButton } from "./_components/ShareButton";
import { useCollabProvider } from "./_components/useCollabProvider";
import { useComments } from "./_components/useComments";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useDoc } from "./_components/useDoc";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useDocShell } from "../_components/DocShellContext";

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export default function DocPage({ params }: Props) {
  const { slug, id } = use(params);
  const {
    doc,
    isSaving,
    saveTitle,
    saveContent,
    addCollaborator,
    updateCollaboratorRole,
    removeCollaborator,
    updateVisibility,
    saveError,
    clearSaveError,
  } = useDoc(id);
  const { workspaces } = useWorkspaces();
  const workspaceName = workspaces.find((w) => w.slug === slug)?.name ?? slug;
  const currentUser = useCurrentUser();
  const { provider, synced } = useCollabProvider(id);
  const comments = useComments(id);
  const { openSidebar, refreshDocs } = useDocShell();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [factCheckStatus, setFactCheckStatus] = useState<string | null>(null);
  const [factCheckHighlights, setFactCheckHighlights] = useState<
    FactCheckVerdict[] | null
  >(null);
  const [runningFactCheck, setRunningFactCheck] = useState(false);
  const factCheckAbortRef = useRef<AbortController | null>(null);

  const runFactCheck = useCallback(async () => {
    if (runningFactCheck) return;
    factCheckAbortRef.current?.abort();
    const ctrl = new AbortController();
    factCheckAbortRef.current = ctrl;
    setRunningFactCheck(true);
    setFactCheckHighlights(null);
    setFactCheckStatus("Extracting claims…");
    const pending: FactCheckVerdict[] = [];
    try {
      await streamFactCheck(
        id,
        (event, data) => {
          const d = data as Record<string, unknown>;
          if (event === "claims_found") {
            setFactCheckStatus(
              `Checking ${d.count} claim${Number(d.count) === 1 ? "" : "s"}…`,
            );
          } else if (event === "claim_start") {
            pending.push({
              index: d.index as number,
              quote: (d.quote as string) ?? "",
              claim: d.claim as string,
              status: "checking",
              summary: "",
              sources: [],
            });
            setFactCheckHighlights([...pending]);
          } else if (event === "verdict") {
            const idx = pending.findIndex((v) => v.index === d.index);
            if (idx !== -1) {
              pending[idx] = {
                ...pending[idx],
                quote: (d.quote as string) ?? pending[idx].quote,
                status: d.status as FactCheckVerdict["status"],
                summary: d.summary as string,
                sources: (d.sources as FactCheckVerdict["sources"]) ?? [],
              };
              setFactCheckHighlights([...pending]);
            }
          } else if (event === "done") {
            const confirmed = pending.filter(
              (v) => v.status === "confirmed",
            ).length;
            const disputed = pending.filter(
              (v) => v.status === "disputed",
            ).length;
            const summary =
              pending.length === 0
                ? (d.message as string) || "No verifiable claims found"
                : `${confirmed} confirmed · ${disputed} disputed`;
            setFactCheckStatus(summary);
            setTimeout(() => setFactCheckStatus(null), 5000);
          } else if (event === "error") {
            setFactCheckStatus((d.message as string) || "Fact check failed");
            setTimeout(() => setFactCheckStatus(null), 6000);
          }
        },
        ctrl.signal,
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setFactCheckStatus((err as Error).message || "Fact check failed");
        setTimeout(() => setFactCheckStatus(null), 6000);
      }
    } finally {
      setRunningFactCheck(false);
    }
  }, [id, runningFactCheck]);
  const [focusedThreadId, setFocusedThreadId] = useState<string | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [liveContent, setLiveContent] = useState<string | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [doc?.title]);

  useEffect(() => {
    const display = doc?.title?.trim() || "Untitled";
    document.title = `${display} — Lumen`;
    return () => {
      document.title = "Lumen";
    };
  }, [doc?.title]);

  useEffect(() => {
    if (!provider?.document || !synced) return;
    const yMeta = provider.document.getMap<string>("meta");
    const initial = yMeta.get("title");
    if (initial === undefined && doc?.title) {
      yMeta.set("title", doc.title);
    }
    const apply = (value: string) => {
      const el = titleRef.current;
      if (!el || document.activeElement === el) return;
      if (el.value === value) return;
      el.value = value;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
      document.title = `${value.trim() || "Untitled"} — Lumen`;
    };
    if (typeof initial === "string") apply(initial);
    const handler = () => {
      const next = yMeta.get("title");
      if (typeof next === "string") apply(next);
    };
    yMeta.observe(handler);
    return () => yMeta.unobserve(handler);
  }, [provider, synced, doc?.title]);

  if (!doc)
    return mounted ? (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress size={22} thickness={2} />
      </Box>
    ) : null;

  const canEdit = doc.role === "owner" || doc.role === "editor";

  return (
    <>
      <Box
        sx={(theme) => ({
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          pt: { xs: 0.75, md: 1 },
          pr: { xs: 0.75, md: 1 },
          pb: { xs: 0.75, md: 1 },
          pl: { xs: 0.75, md: 2.5 },
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
              px: { xs: 2, md: 4 },
              py: 2,
              flexShrink: 0,
              gap: { xs: 1.5, md: 3 },
              borderBottom: "1px solid",
              borderColor: "divider",
              animationDelay: "0.1s",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.75,
                minWidth: 0,
                flex: 1,
              }}
            >
              <IconButton
                size="small"
                onClick={openSidebar}
                sx={{
                  display: { xs: "inline-flex", md: "none" },
                  width: 32,
                  height: 32,
                  color: "text.secondary",
                  opacity: 0.75,
                  ml: -0.5,
                }}
              >
                <MenuRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <Typography
                  noWrap
                  sx={{
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    color: "text.disabled",
                    flexShrink: 0,
                  }}
                >
                  {workspaceName}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.82rem",
                    color: "text.disabled",
                    opacity: 0.5,
                    flexShrink: 0,
                  }}
                >
                  ›
                </Typography>
                <Typography
                  noWrap
                  sx={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "text.secondary",
                    minWidth: 0,
                  }}
                >
                  {doc.title || "Untitled"}
                </Typography>
                {isSaving && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.625,
                      ml: 1.5,
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      className="lumen-pulse"
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "secondary.main",
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 500,
                        color: "text.disabled",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Saving
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <PresenceAvatars
                provider={provider}
                currentUserName={currentUser?.name}
              />
              <Tooltip title="Comments">
                <IconButton
                  id="tour-comments"
                  size="small"
                  onClick={() => setCommentsOpen(true)}
                  sx={{
                    position: "relative",
                    width: 32,
                    height: 32,
                    color: "text.secondary",
                    opacity: 0.7,
                    transition: "all 0.2s",
                    "&:hover": {
                      opacity: 1,
                      color: "primary.main",
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 15 }} />
                  {comments.threads.filter((t) => !t.resolved).length > 0 && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        minWidth: 14,
                        height: 14,
                        px: "3px",
                        borderRadius: "7px",
                        backgroundColor: "primary.main",
                        color: "white",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {comments.threads.filter((t) => !t.resolved).length}
                    </Box>
                  )}
                </IconButton>
              </Tooltip>
              <Box id="tour-share" sx={{ display: "inline-flex" }}>
                <ShareButton
                  collaborators={doc.collaborators}
                  isOwner={doc.role === "owner"}
                  visibility={doc.visibility}
                  onAdd={addCollaborator}
                  onUpdateRole={updateCollaboratorRole}
                  onRemove={removeCollaborator}
                  onUpdateVisibility={updateVisibility}
                />
              </Box>
              <Box id="tour-doc-menu" sx={{ display: "inline-flex" }}>
                <DocMenu
                  docId={id}
                  title={doc.title}
                  html={liveContent ?? doc.content}
                  onSummarize={canEdit ? () => setSummaryOpen(true) : undefined}
                  onFactCheck={runningFactCheck ? undefined : runFactCheck}
                />
              </Box>
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
                component="textarea"
                id="tour-doc-title"
                ref={titleRef}
                defaultValue={doc.title}
                readOnly={!canEdit}
                placeholder="Untitled"
                rows={1}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${el.scrollHeight}px`;
                  if (provider?.document) {
                    provider.document
                      .getMap<string>("meta")
                      .set("title", el.value);
                  }
                  document.title = `${el.value.trim() || "Untitled"} — Lumen`;
                }}
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
                  resize: "none",
                  overflow: "hidden",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fieldSizing: "content",
                  "::placeholder": {
                    color: "text.disabled",
                    opacity: 0.5,
                  },
                }}
              />

              <Box id="tour-editor">
                <DocEditor
                  content={doc.content}
                  readOnly={!canEdit}
                  user={currentUser ?? undefined}
                  provider={provider}
                  synced={synced}
                  onContentSave={saveContent}
                  onContentChange={setLiveContent}
                  onCreateComment={canEdit ? comments.createThread : undefined}
                  onOpenThread={(threadId) => {
                    setFocusedThreadId(threadId);
                    setCommentsOpen(true);
                  }}
                  threadIds={
                    comments.loaded
                      ? comments.threads.map((t) => t.id)
                      : undefined
                  }
                  resolvedThreadIds={
                    comments.loaded
                      ? comments.threads
                          .filter((t) => t.resolved)
                          .map((t) => t.id)
                      : undefined
                  }
                  factCheckHighlights={factCheckHighlights}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <CommentsPanel
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        threads={comments.threads}
        focusedThreadId={focusedThreadId}
        onFocusThread={setFocusedThreadId}
        onReply={comments.reply}
        onResolve={comments.resolve}
        onDelete={comments.remove}
        currentUserId={currentUser?.id}
      />
      <SummaryPanel
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        docId={id}
        onInsertAtTop={
          canEdit
            ? (markdown) => {
                const html = `<blockquote><p><strong>Summary:</strong> ${markdown.replace(/</g, "&lt;")}</p></blockquote>`;
                void saveContent(html + (doc.content ?? ""));
              }
            : undefined
        }
      />
      <DocTour autoStart={mounted} />
      <Snackbar
        open={!!factCheckStatus}
        message={factCheckStatus}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={() => setFactCheckStatus(null)}
      />
      <Snackbar
        open={!!saveError}
        message={saveError}
        autoHideDuration={3000}
        onClose={clearSaveError}
      />
    </>
  );
}
