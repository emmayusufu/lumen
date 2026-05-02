"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import type { CommentThread } from "@/lib/api";
import { ThreadCard } from "./comments/ThreadCard";

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
  const unresolved = useMemo(
    () => threads.filter((t) => !t.resolved),
    [threads],
  );
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
            <ChatBubbleOutlineRoundedIcon
              sx={{ fontSize: 16, color: "primary.main" }}
            />
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
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ width: 28, height: 28, color: "text.secondary" }}
          >
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 1.5,
            py: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {visible.length === 0 ? (
            <EmptyState showResolved={showResolved} />
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
                "&:hover": {
                  color: "text.primary",
                  backgroundColor: "action.hover",
                },
              }}
            >
              {showResolved
                ? "Hide resolved"
                : `Show resolved · ${resolved.length}`}
            </Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}

function EmptyState({ showResolved }: { showResolved: boolean }) {
  return (
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
        <ChatBubbleOutlineRoundedIcon
          sx={{ fontSize: 20, color: "text.disabled" }}
        />
      </Box>
      <Typography
        sx={{ fontSize: "0.88rem", fontWeight: 600, color: "text.primary" }}
      >
        {showResolved ? "No comments yet" : "No open comments"}
      </Typography>
      <Typography
        sx={{ fontSize: "0.78rem", color: "text.secondary", lineHeight: 1.5 }}
      >
        {showResolved
          ? "Nothing here. Resolved threads will appear once you close some."
          : "Select text in the doc, then hit the comment button to start a thread."}
      </Typography>
    </Box>
  );
}
