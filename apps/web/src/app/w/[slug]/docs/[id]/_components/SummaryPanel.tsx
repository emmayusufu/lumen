"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VerticalAlignTopRoundedIcon from "@mui/icons-material/VerticalAlignTopRounded";
import { type SummaryLength, streamDocSummary } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  docId: string;
  onInsertAtTop?: (markdown: string) => void;
}

export function SummaryPanel({ open, onClose, docId, onInsertAtTop }: Props) {
  const [length, setLength] = useState<SummaryLength>("medium");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = async (chosen: SummaryLength) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setText("");
    setError(null);
    setBusy(true);
    try {
      await streamDocSummary(
        docId,
        chosen,
        (t) => setText((prev) => prev + t),
        ctrl.signal,
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("summary failed", err);
        setError((err as Error).message || "Summary failed");
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (open && !text && !busy) void run(length);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleLength = (
    _: React.MouseEvent<HTMLElement>,
    next: SummaryLength | null,
  ) => {
    if (!next || next === length) return;
    setLength(next);
    void run(next);
  };

  const copy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

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
            width: { xs: "100%", sm: 420 },
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
            <AutoAwesomeRoundedIcon
              sx={{ fontSize: 16, color: "primary.main" }}
            />
            <Typography sx={{ fontSize: "0.92rem", fontWeight: 700 }}>
              Summary
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ width: 28, height: 28, color: "text.secondary" }}
          >
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Box sx={{ px: 2.5, pt: 1.5, pb: 1, flexShrink: 0 }}>
          <ToggleButtonGroup
            size="small"
            value={length}
            exclusive
            onChange={handleLength}
            disabled={busy}
            sx={{
              "& .MuiToggleButton-root": {
                fontSize: "0.74rem",
                textTransform: "none",
                px: 1.5,
                py: 0.375,
                borderColor: "divider",
              },
            }}
          >
            <ToggleButton value="short">Short</ToggleButton>
            <ToggleButton value="medium">Medium</ToggleButton>
            <ToggleButton value="long">Long</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 2.5,
            pt: 0.5,
            pb: 2,
            fontSize: "0.92rem",
            lineHeight: 1.6,
            color: "text.primary",
            whiteSpace: "pre-wrap",
          }}
        >
          {text}
          {busy && (
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: 8,
                height: "1em",
                ml: 0.25,
                verticalAlign: "text-bottom",
                backgroundColor: "primary.main",
                animation: "summary-blink 1s infinite",
                "@keyframes summary-blink": {
                  "0%, 50%": { opacity: 1 },
                  "51%, 100%": { opacity: 0.2 },
                },
              }}
            />
          )}
          {error && (
            <Typography
              sx={{ color: "error.main", fontSize: "0.85rem", mt: 1 }}
            >
              {error}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            px: 2,
            py: 1,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            gap: 0.75,
            flexShrink: 0,
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.02)"
                : "rgba(0,0,0,0.01)",
          }}
        >
          <Button
            size="small"
            startIcon={
              copied ? (
                <CheckRoundedIcon sx={{ fontSize: 14 }} />
              ) : (
                <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
              )
            }
            disabled={!text || busy}
            onClick={() => void copy()}
            sx={{
              fontSize: "0.78rem",
              textTransform: "none",
              color: "text.secondary",
            }}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
          {onInsertAtTop && (
            <Button
              size="small"
              startIcon={<VerticalAlignTopRoundedIcon sx={{ fontSize: 14 }} />}
              disabled={!text || busy}
              onClick={() => {
                onInsertAtTop(text);
                onClose();
              }}
              sx={{
                fontSize: "0.78rem",
                textTransform: "none",
                color: "text.secondary",
              }}
            >
              Insert at top
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            startIcon={<RefreshRoundedIcon sx={{ fontSize: 14 }} />}
            disabled={busy}
            onClick={() => void run(length)}
            sx={{
              fontSize: "0.78rem",
              textTransform: "none",
              color: "text.secondary",
            }}
          >
            Try again
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
