"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onClear: () => void;
  activeAgent?: string;
  isLoading?: boolean;
}

const AGENT_LABELS: Record<string, string> = {
  supervisor: "Routing",
  planner: "Planning",
  researcher: "Searching",
  coder: "Finding code",
  writer: "Writing",
};

export function Header({ onClear, activeAgent, isLoading }: HeaderProps) {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        display: "flex",
        justifyContent: "center",
        pt: 1.5,
        px: 2,
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          height: 44,
          pl: 1.5,
          pr: 1,
          borderRadius: "22px",
          pointerEvents: "auto",
          border: 1,
          borderColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.08)",
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(19, 28, 49, 0.92)"
              : "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(24px) saturate(180%)",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 4px 24px rgba(0,0,0,0.5)"
              : "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: "8px",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <TravelExploreIcon
            sx={{
              color: "white",
              fontSize: 15,
              animation: isLoading ? "spin 1.5s linear infinite" : "none",
              "@keyframes spin": {
                from: { transform: "rotate(0deg)" },
                to: { transform: "rotate(360deg)" },
              },
            }}
          />
        </Box>

        <Typography
          noWrap
          sx={{
            fontWeight: 700,
            fontSize: "0.82rem",
            letterSpacing: "-0.01em",
            color: "text.primary",
          }}
        >
          Research
        </Typography>

        {isLoading && activeAgent && (
          <Chip
            label={AGENT_LABELS[activeAgent] || activeAgent}
            size="small"
            sx={{
              height: 22,
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.02em",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(45,212,191,0.15)"
                  : "rgba(13,148,136,0.1)",
              color: "primary.main",
              "& .MuiChip-label": { px: 1 },
            }}
          />
        )}

        <Box
          sx={{
            width: "1px",
            height: 18,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.1)",
            mx: 0.25,
          }}
        />

        <Tooltip title="Clear chat" arrow>
          <IconButton
            onClick={onClear}
            size="small"
            sx={{
              width: 28,
              height: 28,
              color: "text.secondary",
              "&:hover": { color: "error.main" },
            }}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>

        <ThemeToggle />

        <Tooltip title="Sign out" arrow>
          <IconButton
            onClick={() => signOut({ callbackUrl: "/login" })}
            size="small"
            sx={{
              width: 28,
              height: 28,
              color: "text.secondary",
              "&:hover": { color: "text.primary" },
            }}
          >
            <LogoutRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
