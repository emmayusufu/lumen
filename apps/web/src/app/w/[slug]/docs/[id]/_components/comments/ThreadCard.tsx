"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import type { CommentThread } from "@/lib/api";
import { Message } from "./Message";

interface Props {
  thread: CommentThread;
  focused: boolean;
  onFocus: () => void;
  onReply: (body: string) => Promise<void>;
  onResolve: (resolved: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
  currentUserId?: string;
  scrollIntoView?: boolean;
}

export function ThreadCard({
  thread,
  focused,
  onFocus,
  onReply,
  onResolve,
  onDelete,
  currentUserId,
  scrollIntoView,
}: Props) {
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);
  const canDelete = thread.created_by === currentUserId;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollIntoView)
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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
            authorName={
              firstMessage.author_name || firstMessage.author_email || "Unknown"
            }
            body={firstMessage.body}
            createdAt={firstMessage.created_at}
            isFirst
          />
        )}
        {replies.length > 0 && (
          <Box
            sx={{
              mt: 0.25,
              pl: 4.5,
              borderLeft: "1px dashed",
              borderColor: "divider",
              ml: 1.5,
            }}
          >
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
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.02)"
              : "rgba(0,0,0,0.01)",
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
                  "&:focus-within": {
                    boxShadow: "0 0 0 2px rgba(186, 200, 160, 0.2)",
                  },
                }),
              })}
            >
              <Box
                component="textarea"
                placeholder="Write a reply…"
                value={replyBody}
                onChange={(e) =>
                  setReplyBody((e.target as HTMLTextAreaElement).value)
                }
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
                  backgroundColor: replyBody.trim()
                    ? "primary.main"
                    : "transparent",
                  color: replyBody.trim() ? "white" : "text.disabled",
                  "&:hover": {
                    backgroundColor: replyBody.trim()
                      ? "primary.dark"
                      : "action.hover",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "transparent",
                    color: "text.disabled",
                  },
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
            <Typography
              sx={{
                fontSize: "0.72rem",
                color: "text.secondary",
                pl: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
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
                "&:hover": {
                  color: "primary.main",
                  backgroundColor: "action.hover",
                },
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
                  "&:hover": {
                    color: "error.main",
                    backgroundColor: "action.hover",
                  },
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
