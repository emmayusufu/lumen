"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { PresetList, type PresetKey } from "./PresetList";
import { PromptInput } from "./PromptInput";
import { ToneSubmenu } from "./ToneSubmenu";
import { StreamingPreview } from "./StreamingPreview";
import { PreviewActions } from "./PreviewActions";
import { useInlineAI } from "./useInlineAI";
import type { InlineAIRequest, InlineTone } from "@/lib/api";

interface VirtualAnchor {
  nodeType: 1;
  getBoundingClientRect: () => DOMRect;
}

interface Props {
  open: boolean;
  anchor: VirtualAnchor | null;
  mode: "selection" | "generate";
  selection: string;
  context: string;
  onReplace: (text: string) => void;
  onInsertBelow: (text: string) => void;
  onClose: () => void;
}

export function AIPanel({
  open,
  anchor,
  mode,
  selection,
  context,
  onReplace,
  onInsertBelow,
  onClose,
}: Props) {
  const [view, setView] = useState<"root" | "tone">("root");
  const [lastRequest, setLastRequest] = useState<InlineAIRequest | null>(null);
  const ai = useInlineAI();

  useEffect(() => {
    if (!open) {
      ai.reset();
      setView("root");
      setLastRequest(null);
    }
  }, [open, ai]);

  const runRequest = (req: InlineAIRequest) => {
    setLastRequest(req);
    void ai.run(req);
  };

  const handlePreset = (key: PresetKey) => {
    if (key === "tone-submenu") {
      setView("tone");
      return;
    }
    if (key === "continue") {
      runRequest({ action: "continue", selection: "", context });
      return;
    }
    if (key === "outline") {
      runRequest({
        action: "outline",
        topic: context.slice(0, 200) || "document",
        context,
      });
      return;
    }
    runRequest({ action: key, selection, context });
  };

  const handleTone = (tone: InlineTone) => {
    setView("root");
    runRequest({ action: "tone", tone, selection, context });
  };

  const handleCustom = (prompt: string) => {
    runRequest({
      action: "custom",
      prompt,
      selection: mode === "selection" ? selection : "",
      context,
    });
  };

  const handleReplace = () => {
    const text = ai.final || ai.draft;
    if (text) onReplace(text);
    onClose();
  };

  const handleInsertBelow = () => {
    const text = ai.final || ai.draft;
    if (text) onInsertBelow(text);
    onClose();
  };

  const handleRetry = () => {
    if (lastRequest) runRequest(lastRequest);
  };

  return (
    <Popover
      open={open}
      anchorEl={anchor as unknown as Element}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          sx: {
            width: 340,
            mt: 0.75,
            borderRadius: "10px",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 12px 32px rgba(42, 37, 32, 0.12)",
            overflow: "hidden",
            backgroundColor: "background.paper",
            backgroundImage: "none",
          },
        },
      }}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.5,
          py: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: "rgba(139, 155, 110, 0.07)",
          ...theme.applyStyles("dark", {
            backgroundColor: "rgba(186, 200, 160, 0.07)",
          }),
        })}
      >
        <AutoAwesomeRoundedIcon sx={{ fontSize: 13, color: "primary.main" }} />
        <Typography
          sx={{
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Ask AI
        </Typography>
      </Box>

      {ai.status === "idle" && view === "root" && (
        <>
          <PresetList mode={mode} onPick={handlePreset} />
          <PromptInput
            placeholder={
              mode === "selection"
                ? "Tell AI what to do with this…"
                : "Ask AI to write anything…"
            }
            onSubmit={handleCustom}
          />
        </>
      )}

      {ai.status === "idle" && view === "tone" && (
        <ToneSubmenu onPick={handleTone} onBack={() => setView("root")} />
      )}

      {ai.status === "generating" && (
        <StreamingPreview text={ai.draft} stage="writing" />
      )}

      {ai.status === "preview" && (
        <>
          <StreamingPreview text={ai.final || ai.draft} stage="idle" />
          <PreviewActions
            mode={mode}
            onReplace={handleReplace}
            onInsertBelow={handleInsertBelow}
            onRetry={handleRetry}
            onDiscard={onClose}
          />
        </>
      )}

      {ai.status === "error" && (
        <Box sx={{ p: 1.5 }}>
          <Typography sx={{ fontSize: "0.78rem", color: "error.main" }}>
            {ai.error ?? "Request failed"}
          </Typography>
        </Box>
      )}

      {ai.status === "no_credentials" && (
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography sx={{ fontSize: "0.82rem", color: "text.primary" }}>
            Ask AI needs a DeepSeek API key.
          </Typography>
          <Box
            component={Link}
            href="/settings/api-keys"
            onClick={onClose}
            sx={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "primary.main",
              textDecoration: "none",
              "&:hover": { opacity: 0.7 },
            }}
          >
            Configure in Settings →
          </Box>
        </Box>
      )}
    </Popover>
  );
}
