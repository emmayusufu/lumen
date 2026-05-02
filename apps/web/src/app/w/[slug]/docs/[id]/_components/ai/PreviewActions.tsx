"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

interface Props {
  mode: "selection" | "generate";
  onReplace: () => void;
  onInsertBelow: () => void;
  onRetry: () => void;
  onDiscard: () => void;
}

export function PreviewActions({
  mode,
  onReplace,
  onInsertBelow,
  onRetry,
  onDiscard,
}: Props) {
  const primaryLabel = mode === "selection" ? "Replace" : "Accept";
  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.75,
        px: 1.5,
        pb: 1.25,
        pt: 0.25,
        flexWrap: "wrap",
      }}
    >
      <Button
        variant="contained"
        size="small"
        onClick={onReplace}
        sx={{
          fontSize: "0.72rem",
          fontWeight: 700,
          px: 1.5,
          py: 0.5,
          minHeight: 26,
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        }}
      >
        {primaryLabel}
      </Button>
      {mode === "selection" && (
        <Button
          variant="outlined"
          size="small"
          onClick={onInsertBelow}
          sx={{
            fontSize: "0.72rem",
            fontWeight: 600,
            px: 1.5,
            py: 0.5,
            minHeight: 26,
            borderColor: "divider",
            color: "text.secondary",
            "&:hover": { borderColor: "text.disabled", color: "text.primary" },
          }}
        >
          Insert below
        </Button>
      )}
      <Button
        variant="text"
        size="small"
        onClick={onRetry}
        sx={{
          fontSize: "0.72rem",
          fontWeight: 600,
          px: 1,
          py: 0.5,
          minHeight: 26,
          color: "text.secondary",
          "&:hover": { color: "text.primary", backgroundColor: "transparent" },
        }}
      >
        Try again
      </Button>
      <Button
        variant="text"
        size="small"
        onClick={onDiscard}
        sx={{
          fontSize: "0.72rem",
          fontWeight: 600,
          px: 1,
          py: 0.5,
          minHeight: 26,
          ml: "auto",
          color: "text.disabled",
          "&:hover": { color: "text.primary", backgroundColor: "transparent" },
        }}
      >
        Discard
      </Button>
    </Box>
  );
}
