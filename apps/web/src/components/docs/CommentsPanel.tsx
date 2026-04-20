"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import type { CommentThread } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  threads: CommentThread[];
  focusedThreadId: string | null;
  onFocusThread: (id: string | null) => void;
  onReply: (threadId: string, body: string) => Promise<void>;
  onResolve: (threadId: string, resolved: boolean) => Promise<void>;
  onDelete: (threadId: string) => Promise<void>;
  currentUserId?: string;
}

const INITIALS = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "?";

const COLORS = ["#8B9B6E", "#B8804A", "#6E8B9B", "#9B6E8B", "#6E9B8B", "#9B8B6E"];
const colorFor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
};

function timeAgo(iso: string): string {
  try {
    const d = new Date(iso);
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

function Avatar({ userId, name, size = 26 }: { userId: string; name: string; size?: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: colorFor(userId),
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size <= 22 ? "0.62rem" : "0.72rem",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {INITIALS(name)}
    </Box>
  );
}

function Message({
  authorId,
  authorName,
  body,
  createdAt,
  isFirst,
}: {
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  isFirst: boolean;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1.25, pt: isFirst ? 0 : 1.25, pb: 0 }}>
      <Avatar userId={authorId} name={authorName} size={isFirst ? 26 : 22} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "text.primary" }}>
            {authorName}
          </Typography>
          <Typography sx={{ fontSize: "0.68rem", color: "text.disabled" }}>
            {timeAgo(createdAt)}
          </Typography>
        </Box>
        <Typography
          sx={{ fontSize: "0.86rem", lineHeight: 1.5, color: "text.primary", whiteSpace: "pre-wrap", mt: 0.125 }}
        >
          {body}
        </Typography>
      </Box>
    </Box>
  );
}

function ThreadCard({
  thread,
  focused,
  onFocus,
  onReply,
  onResolve,
  onDelete,
  currentUserId,
  scrollIntoView,
}: {
  thread: CommentThread;
  focused: boolean;
  onFocus: () => void;
  onReply: (body: string) => Promise<void>;
  onResolve: (resolved: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
  currentUserId?: string;
  scrollIntoView?: boolean;
}) {
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);
  const canDelete = thread.created_by === currentUserId;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollIntoView) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [scrollIntoView]);

  const submit = async () => {
    const text = replyBody.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      await onReply(text);
      setReplyBody("");
    } finally {
      setBusy(false);
    }
  };

  const [firstMessage, ...replies] = thread.messages;

  return (
    <Box
      ref={ref}
      onClick={onFocus}
      sx={(theme) => ({
        borderRadius: "10px",
        border: "1px solid",
        borderColor: focused ? "primary.main" : "divider",
        backgroundColor: "background.paper",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        overflow: "hidden",
        opacity: thread.resolved ? 0.65 : 1,
        "&:hover": {
          borderColor: focused ? "primary.main" : "rgba(139, 155, 110, 0.35)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        },
        ...theme.applyStyles("dark", {
          backgroundColor: "#1a1810",
          "&:hover": {
            borderColor: focused ? "primary.main" : "rgba(186, 200, 160, 0.28)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          },
        }),
      })}
    >
      <Box sx={{ px: 1.75, pt: 1.5, pb: 0.5 }}>
        {firstMessage && (
          <Message
            authorId={firstMessage.author_id}
            authorName={firstMessage.author_name || firstMessage.author_email || "Unknown"}
            body={firstMessage.body}
            createdAt={firstMessage.created_at}
            isFirst={true}
          />
        )}
        {replies.length > 0 && (
          <Box sx={{ mt: 0.25, pl: 4.5, borderLeft: "1px dashed", borderColor: "divider", ml: 1.5 }}>
            {replies.map((m) => (
              <Message
                key={m.id}
                authorId={m.author_id}
                authorName={m.author_name || m.author_email || "Unknown"}
                body={m.body}
                createdAt={m.created_at}
                isFirst={false}
              />
            ))}
          </Box>
        )}
      </Box>

      <Box
        sx={{
          borderTop: "1px solid",
          borderColor: "divider",
          backgroundColor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)"),
        }}
      >
        {!thread.resolved && (
          <Box
            sx={{ px: 1.25, pt: 1, pb: 0.5 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              sx={(theme) => ({
                display: "flex",
                alignItems: "flex-end",
                gap: 0.75,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "8px",
                p: 0.75,
                backgroundColor: "background.paper",
                transition: "border-color 0.15s, box-shadow 0.15s",
                "&:focus-within": {
                  borderColor: "primary.main",
                  boxShadow: "0 0 0 2px rgba(139, 155, 110, 0.15)",
                },
                ...theme.applyStyles("dark", {
                  "&:focus-within": { boxShadow: "0 0 0 2px rgba(186, 200, 160, 0.2)" },
                }),
              })}
            >
              <Box
                component="textarea"
                placeholder="Write a reply…"
                value={replyBody}
                onChange={(e) => setReplyBody((e.target as HTMLTextAreaElement).value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void submit();
                  }
                }}
                sx={{
                  flex: 1,
                  minHeight: "26px",
                  maxHeight: "120px",
                  px: 0.5,
                  py: 0.25,
                  border: "none",
                  outline: "none",
                  resize: "none",
                  background: "transparent",
                  fontFamily: "inherit",
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                  color: "text.primary",
                  "::placeholder": { color: "text.disabled", opacity: 0.85 },
                }}
                rows={1}
              />
              <IconButton
                size="small"
                disabled={!replyBody.trim() || busy}
                onClick={(e) => {
                  e.stopPropagation();
                  void submit();
                }}
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: "7px",
                  flexShrink: 0,
                  backgroundColor: replyBody.trim() ? "primary.main" : "transparent",
                  color: replyBody.trim() ? "white" : "text.disabled",
                  "&:hover": {
                    backgroundColor: replyBody.trim() ? "primary.dark" : "action.hover",
                  },
                  "&.Mui-disabled": { backgroundColor: "transparent", color: "text.disabled" },
                }}
              >
                <ArrowUpwardRoundedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          </Box>
        )}
        <Box
          sx={{
            px: 1.25,
            pt: thread.resolved ? 0.75 : 0.25,
            pb: 0.75,
            display: "flex",
            alignItems: "center",
            justifyContent: thread.resolved ? "space-between" : "flex-end",
            gap: 0.5,
          }}
        >
          {thread.resolved && (
            <Typography sx={{ fontSize: "0.72rem", color: "text.secondary", pl: 0.5, display: "flex", alignItems: "center", gap: 0.5 }}>
              <CheckRoundedIcon sx={{ fontSize: 13, color: "primary.main" }} />
              Resolved
            </Typography>
          )}
          <Box sx={{ display: "flex", gap: 0.25 }}>
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                void onResolve(!thread.resolved);
              }}
              startIcon={
                thread.resolved ? (
                  <UndoRoundedIcon sx={{ fontSize: 13 }} />
                ) : (
                  <CheckRoundedIcon sx={{ fontSize: 13 }} />
                )
              }
              sx={{
                fontSize: "0.72rem",
                fontWeight: 500,
                color: "text.secondary",
                textTransform: "none",
                minWidth: 0,
                px: 0.875,
                py: 0.375,
                "& .MuiButton-startIcon": { mr: 0.5 },
                "&:hover": { color: "primary.main", backgroundColor: "action.hover" },
              }}
            >
              {thread.resolved ? "Reopen" : "Resolve"}
            </Button>
            {canDelete && (
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  void onDelete();
                }}
                startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 13 }} />}
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 500,
                  color: "text.secondary",
                  textTransform: "none",
                  minWidth: 0,
                  px: 0.875,
                  py: 0.375,
                  "& .MuiButton-startIcon": { mr: 0.5 },
                  "&:hover": { color: "error.main", backgroundColor: "action.hover" },
                }}
              >
                Delete
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export function CommentsPanel({
  open,
  onClose,
  threads,
  focusedThreadId,
  onFocusThread,
  onReply,
  onResolve,
  onDelete,
  currentUserId,
}: Props) {
  const [showResolved, setShowResolved] = useState(false);
  const unresolved = useMemo(() => threads.filter((t) => !t.resolved), [threads]);
  const resolved = useMemo(() => threads.filter((t) => t.resolved), [threads]);

  useEffect(() => {
    if (!focusedThreadId) return;
    const focused = threads.find((t) => t.id === focusedThreadId);
    if (focused?.resolved) setShowResolved(true);
  }, [focusedThreadId, threads]);

  const visible = showResolved ? threads : unresolved;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      ModalProps={{ keepMounted: true }}
      slotProps={{
        paper: {
          sx: (theme) => ({
            width: { xs: "100%", sm: 380 },
            backgroundColor: "#EEE8D8",
            borderLeft: "1px solid",
            borderColor: "divider",
            ...theme.applyStyles("dark", { backgroundColor: "#121006" }),
          }),
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box
          sx={{
            px: 2.5,
            py: 1.75,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 16, color: "primary.main" }} />
            <Typography sx={{ fontSize: "0.92rem", fontWeight: 700 }}>
              Comments
            </Typography>
            {unresolved.length > 0 && (
              <Box
                sx={{
                  minWidth: 20,
                  height: 20,
                  px: 0.75,
                  borderRadius: "10px",
                  backgroundColor: "primary.main",
                  color: "white",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {unresolved.length}
              </Box>
            )}
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ width: 28, height: 28, color: "text.secondary" }}>
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", px: 1.5, py: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
          {visible.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                mt: 6,
                px: 3,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  backgroundColor: "action.hover",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 0.5,
                }}
              >
                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 20, color: "text.disabled" }} />
              </Box>
              <Typography sx={{ fontSize: "0.88rem", fontWeight: 600, color: "text.primary" }}>
                {showResolved ? "No comments yet" : "No open comments"}
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", lineHeight: 1.5 }}>
                {showResolved
                  ? "Nothing here. Resolved threads will appear once you close some."
                  : "Select text in the doc, then hit the comment button to start a thread."}
              </Typography>
            </Box>
          ) : (
            visible.map((t) => (
              <ThreadCard
                key={t.id}
                thread={t}
                focused={t.id === focusedThreadId}
                onFocus={() => onFocusThread(t.id)}
                onReply={(body) => onReply(t.id, body)}
                onResolve={(r) => onResolve(t.id, r)}
                onDelete={() => onDelete(t.id)}
                currentUserId={currentUserId}
                scrollIntoView={t.id === focusedThreadId}
              />
            ))
          )}
        </Box>

        {resolved.length > 0 && (
          <Box
            sx={{
              borderTop: "1px solid",
              borderColor: "divider",
              px: 2,
              py: 1,
              flexShrink: 0,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Box
              onClick={() => setShowResolved((v) => !v)}
              sx={{
                fontSize: "0.76rem",
                color: "text.secondary",
                cursor: "pointer",
                px: 1.25,
                py: 0.5,
                borderRadius: "6px",
                transition: "color 0.15s, background-color 0.15s",
                "&:hover": { color: "text.primary", backgroundColor: "action.hover" },
              }}
            >
              {showResolved ? "Hide resolved" : `Show resolved · ${resolved.length}`}
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
