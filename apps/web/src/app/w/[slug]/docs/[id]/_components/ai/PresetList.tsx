"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import ContentCutRoundedIcon from "@mui/icons-material/ContentCutRounded";
import UnfoldMoreRoundedIcon from "@mui/icons-material/UnfoldMoreRounded";
import SpellcheckRoundedIcon from "@mui/icons-material/SpellcheckRounded";
import RecordVoiceOverRoundedIcon from "@mui/icons-material/RecordVoiceOverRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import type { InlineAction } from "@/lib/api";

export type PresetKey = InlineAction | "tone-submenu";

interface PresetItem {
  key: PresetKey;
  label: string;
  Icon: React.ElementType;
  trailing?: "chevron";
}

const SELECTION_PRESETS: PresetItem[] = [
  { key: "improve", label: "Improve writing", Icon: AutoFixHighRoundedIcon },
  { key: "shorter", label: "Make shorter", Icon: ContentCutRoundedIcon },
  { key: "longer", label: "Make longer", Icon: UnfoldMoreRoundedIcon },
  {
    key: "grammar",
    label: "Fix grammar & spelling",
    Icon: SpellcheckRoundedIcon,
  },
  {
    key: "tone-submenu",
    label: "Change tone",
    Icon: RecordVoiceOverRoundedIcon,
    trailing: "chevron",
  },
  { key: "summarize", label: "Summarize", Icon: NotesRoundedIcon },
];

const GENERATE_PRESETS: PresetItem[] = [
  { key: "continue", label: "Continue writing", Icon: EastRoundedIcon },
  { key: "outline", label: "Write outline", Icon: ListAltRoundedIcon },
];

interface Props {
  mode: "selection" | "generate";
  onPick: (key: PresetKey) => void;
}

export function PresetList({ mode, onPick }: Props) {
  const items = mode === "selection" ? SELECTION_PRESETS : GENERATE_PRESETS;
  return (
    <Box sx={{ py: 0.5 }}>
      {items.map(({ key, label, Icon, trailing }) => (
        <Box
          key={key}
          onClick={() => onPick(key)}
          sx={(theme) => ({
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            px: 1.5,
            py: 0.875,
            cursor: "pointer",
            transition: "background-color 0.12s",
            "&:hover": { backgroundColor: "rgba(139, 155, 110, 0.12)" },
            ...theme.applyStyles("dark", {
              "&:hover": { backgroundColor: "rgba(186, 200, 160, 0.12)" },
            }),
          })}
        >
          <Icon sx={{ fontSize: 15, color: "text.secondary" }} />
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 500, flex: 1 }}>
            {label}
          </Typography>
          {trailing === "chevron" && (
            <ChevronRightRoundedIcon
              sx={{ fontSize: 14, color: "text.disabled" }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
}
