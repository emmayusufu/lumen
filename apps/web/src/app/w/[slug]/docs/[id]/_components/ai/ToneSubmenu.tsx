"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import type { InlineTone } from "@/lib/api";

const TONES: { value: InlineTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "friendly", label: "Friendly" },
  { value: "confident", label: "Confident" },
  { value: "persuasive", label: "Persuasive" },
];

interface Props {
  onPick: (tone: InlineTone) => void;
  onBack: () => void;
}

export function ToneSubmenu({ onPick, onBack }: Props) {
  return (
    <Box sx={{ py: 0.5 }}>
      <Box
        onClick={onBack}
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1.5,
          py: 0.75,
          cursor: "pointer",
          fontSize: "0.76rem",
          color: "text.secondary",
          opacity: 0.75,
          "&:hover": { backgroundColor: "rgba(139, 155, 110, 0.1)" },
          ...theme.applyStyles("dark", {
            "&:hover": { backgroundColor: "rgba(186, 200, 160, 0.1)" },
          }),
        })}
      >
        <ChevronLeftRoundedIcon sx={{ fontSize: 14 }} />
        Back
      </Box>
      {TONES.map((t) => (
        <Box
          key={t.value}
          onClick={() => onPick(t.value)}
          sx={(theme) => ({
            px: 1.5,
            py: 0.875,
            cursor: "pointer",
            "&:hover": { backgroundColor: "rgba(139, 155, 110, 0.12)" },
            ...theme.applyStyles("dark", {
              "&:hover": { backgroundColor: "rgba(186, 200, 160, 0.12)" },
            }),
          })}
        >
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 500 }}>
            {t.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
