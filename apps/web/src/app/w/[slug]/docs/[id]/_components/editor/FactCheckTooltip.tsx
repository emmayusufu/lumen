"use client";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import type { FactCheckVerdict } from "./factCheckDecorations";

interface Props {
  verdict: FactCheckVerdict;
  anchorRect: DOMRect;
  containerRect: DOMRect;
  onClose: () => void;
}

const META = {
  confirmed: {
    label: "Confirmed",
    color: "#22c55e",
    Icon: CheckCircleOutlineRoundedIcon,
  },
  disputed: {
    label: "Disputed",
    color: "#ef4444",
    Icon: ErrorOutlineRoundedIcon,
  },
  inconclusive: {
    label: "Inconclusive",
    color: "#eab308",
    Icon: HelpOutlineRoundedIcon,
  },
  checking: {
    label: "Checking…",
    color: "#94a3b8",
    Icon: HelpOutlineRoundedIcon,
  },
};

export function FactCheckTooltip({
  verdict,
  anchorRect,
  containerRect,
  onClose,
}: Props) {
  const meta = META[verdict.status] ?? META.inconclusive;
  const { Icon } = meta;

  const tipWidth = 300;
  const spaceAbove = anchorRect.top - containerRect.top;
  const showAbove = spaceAbove > 160;

  const left = Math.min(
    Math.max(anchorRect.left - containerRect.left, 0),
    containerRect.width - tipWidth - 8,
  );
  const top = showAbove
    ? anchorRect.top - containerRect.top - 8
    : anchorRect.bottom - containerRect.top + 8;

  return (
    <Box
      onMouseEnter={onClose.bind(null)}
      sx={(theme) => ({
        position: "absolute",
        left,
        top,
        transform: showAbove ? "translateY(-100%)" : "none",
        width: tipWidth,
        zIndex: 200,
        borderRadius: "10px",
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "#EEE8D8",
        boxShadow: "0 8px 24px rgba(42,37,32,0.14)",
        p: 1.75,
        pointerEvents: "auto",
        ...theme.applyStyles("dark", { backgroundColor: "#1c1a0f" }),
      })}
      onMouseLeave={onClose}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
        <Icon sx={{ fontSize: 15, color: meta.color, flexShrink: 0 }} />
        <Typography
          sx={{
            fontSize: "0.78rem",
            fontWeight: 700,
            color: meta.color,
          }}
        >
          {meta.label}
        </Typography>
      </Box>

      {verdict.summary && (
        <Typography
          sx={{
            fontSize: "0.8rem",
            color: "text.secondary",
            lineHeight: 1.5,
            mb: verdict.sources.length > 0 ? 1 : 0,
          }}
        >
          {verdict.summary}
        </Typography>
      )}

      {verdict.sources.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
          {verdict.sources.slice(0, 3).map((s, i) => (
            <Link
              key={i}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              underline="hover"
              onClick={(e) => e.stopPropagation()}
              sx={{
                fontSize: "0.72rem",
                color: "primary.main",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
              }}
            >
              {s.title || s.url}
            </Link>
          ))}
        </Box>
      )}
    </Box>
  );
}
