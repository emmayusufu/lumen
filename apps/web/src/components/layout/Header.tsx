"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onClear?: () => void;
  onHistoryToggle?: () => void;
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

export function Header({ onClear = () => {}, onHistoryToggle = () => {}, activeAgent, isLoading }: HeaderProps) {
  const handleSignOut = async () => {
    await fetch("/api/backend/api/v1/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

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
        sx={(theme) => ({
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          height: 44,
          pl: 1.5,
          pr: 1,
          borderRadius: "22px",
          pointerEvents: "auto",
          border: 1,
          borderColor: "rgba(0,0,0,0.08)",
          bgcolor: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(24px) saturate(180%)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          ...theme.applyStyles("dark", {
            borderColor: "rgba(255,255,255,0.08)",
            backgroundColor: "rgba(19, 28, 49, 0.92)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }),
        })}
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
          <AutoAwesomeIcon
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
          sx={{ fontWeight: 700, fontSize: "0.82rem", letterSpacing: "-0.01em", color: "text.primary" }}
        >
          Lumen
        </Typography>

        <Button
          component={Link}
          href="/docs"
          startIcon={<ArticleRoundedIcon sx={{ fontSize: 14 }} />}
          size="small"
          sx={{ fontSize: "0.72rem", fontWeight: 600, color: "text.secondary", "&:hover": { color: "text.primary" }, minWidth: 0, px: 1 }}
        >
          Docs
        </Button>

        {isLoading && activeAgent && (
          <Chip
            label={AGENT_LABELS[activeAgent] || activeAgent}
            size="small"
            sx={(theme) => ({
              height: 22,
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.02em",
              bgcolor: "rgba(13,148,136,0.1)",
              color: "primary.main",
              "& .MuiChip-label": { px: 1 },
              ...theme.applyStyles("dark", {
                backgroundColor: "rgba(45,212,191,0.15)",
              }),
            })}
          />
        )}

        <Box
          sx={(theme) => ({
            width: "1px",
            height: 18,
            bgcolor: "rgba(0,0,0,0.1)",
            mx: 0.25,
            ...theme.applyStyles("dark", {
              backgroundColor: "rgba(255,255,255,0.1)",
            }),
          })}
        />

        <Tooltip title="History" arrow>
          <IconButton
            onClick={onHistoryToggle}
            size="small"
            sx={{ width: 28, height: 28, color: "text.secondary", "&:hover": { color: "text.primary" } }}
          >
            <HistoryRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Clear chat" arrow>
          <IconButton
            onClick={onClear}
            size="small"
            sx={{ width: 28, height: 28, color: "text.secondary", "&:hover": { color: "error.main" } }}
          >
            <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>

        <ThemeToggle />

        <Tooltip title="Sign out" arrow>
          <IconButton
            onClick={handleSignOut}
            size="small"
            sx={{ width: 28, height: 28, color: "text.secondary", "&:hover": { color: "text.primary" } }}
          >
            <LogoutRoundedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
