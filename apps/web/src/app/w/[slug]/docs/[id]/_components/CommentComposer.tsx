"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Typography from "@mui/material/Typography";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";

interface Anchor {
  nodeType: 1;
  getBoundingClientRect: () => DOMRect;
}

interface Props {
  open: boolean;
  anchor: Anchor | null;
  snippet: string;
  authorName?: string;
  onSubmit: (body: string) => Promise<void> | void;
  onClose: () => void;
}

const INITIALS = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "?";

export function CommentComposer(props: Props) {
  if (!props.open) return null;
  return <ComposerInner {...props} />;
}

function ComposerInner({
  open,
  anchor,
  snippet,
  authorName,
  onSubmit,
  onClose,
}: Props) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      await onSubmit(text);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Popper
      open={open}
      anchorEl={anchor}
      placement="bottom-start"
      modifiers={[
        { name: "offset", options: { offset: [0, 10] } },
        { name: "preventOverflow", options: { padding: 12 } },
      ]}
      sx={{ zIndex: 1300 }}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper
          elevation={0}
          sx={(theme) => ({
            width: 340,
            borderRadius: "12px",
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
            overflow: "hidden",
            ...theme.applyStyles("dark", {
              backgroundColor: "#1a1810",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }),
          })}
        >
          {snippet && (
            <Box
              sx={{
                px: 1.75,
                pt: 1.5,
                pb: 1,
                borderBottom: "1px solid",
                borderColor: "divider",
                display: "flex",
                gap: 1,
                alignItems: "flex-start",
              }}
            >
              <FormatQuoteRoundedIcon
                sx={{
                  fontSize: 14,
                  color: "primary.main",
                  mt: 0.25,
                  flexShrink: 0,
                  opacity: 0.7,
                }}
              />
              <Typography
                sx={{
                  fontSize: "0.78rem",
                  color: "text.secondary",
                  lineHeight: 1.45,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  wordBreak: "break-word",
                }}
              >
                {snippet}
              </Typography>
            </Box>
          )}

          <Box
            sx={{
              px: 1.75,
              py: 1.5,
              display: "flex",
              gap: 1.25,
              alignItems: "flex-start",
            }}
          >
            {authorName && (
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: "primary.main",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                {INITIALS(authorName)}
              </Box>
            )}
            <Box
              sx={{
                flex: 1,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "8px",
                px: 1.25,
                py: 0.75,
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.015)",
                transition: "border-color 0.15s",
                "&:focus-within": { borderColor: "primary.main" },
              }}
            >
              <Box
                component="textarea"
                autoFocus
                placeholder="Write a comment…"
                value={body}
                onChange={(e) =>
                  setBody((e.target as HTMLTextAreaElement).value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void submit();
                  }
                  if (e.key === "Escape") onClose();
                }}
                sx={{
                  width: "100%",
                  minHeight: "40px",
                  maxHeight: "150px",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  background: "transparent",
                  fontFamily: "inherit",
                  fontSize: "0.87rem",
                  lineHeight: 1.5,
                  color: "text.primary",
                  p: 0,
                  "::placeholder": { color: "text.disabled", opacity: 0.7 },
                }}
                rows={2}
              />
            </Box>
          </Box>

          <Box
            sx={{
              px: 1.75,
              py: 1,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Typography sx={{ fontSize: "0.7rem", color: "text.disabled" }}>
              <Box component="span" sx={{ fontWeight: 600 }}>
                ⌘↵
              </Box>{" "}
              to post
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
              <Button
                size="small"
                onClick={onClose}
                sx={{
                  color: "text.secondary",
                  fontSize: "0.78rem",
                  minWidth: 0,
                  px: 1.25,
                }}
              >
                Cancel
              </Button>
              <IconButton
                size="small"
                disabled={!body.trim() || busy}
                onClick={() => void submit()}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "7px",
                  backgroundColor: "primary.main",
                  color: "white",
                  "&:hover": { backgroundColor: "primary.dark" },
                  "&.Mui-disabled": {
                    backgroundColor: "action.disabledBackground",
                    color: "text.disabled",
                  },
                }}
              >
                <ArrowUpwardRoundedIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}
