"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import type { Doc } from "@/lib/types";

interface Props {
  docs: Doc[];
  currentId: string;
  creating: boolean;
  onCreate: () => void;
}

export function DocSidebar({ docs, currentId, creating, onCreate }: Props) {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch("/api/backend/api/v1/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: (t) => t.palette.mode === "dark" ? "#1c1c1c" : "#EDEEE8",
        borderRight: "1px solid",
        borderColor: "divider",
        height: "100vh",
      }}
    >
      {/* Wordmark */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <Typography
          fontWeight={800}
          fontSize="0.825rem"
          letterSpacing="0.06em"
          sx={{ color: "text.primary", textTransform: "uppercase" }}
        >
          Lumen
        </Typography>
      </Box>

      {/* Doc list */}
      <Box sx={{ flex: 1, overflow: "auto", px: 1, py: 0.5 }}>
        {docs.map((d) => {
          const active = d.id === currentId;
          return (
            <Box
              key={d.id}
              onClick={() => router.push(`/docs/${d.id}`)}
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 0.625,
                borderRadius: "6px",
                cursor: "pointer",
                transition: "background 0.1s ease",
                bgcolor: active
                  ? (t) => t.palette.mode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"
                  : "transparent",
                "&:hover": {
                  bgcolor: active
                    ? undefined
                    : (t) => t.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                },
              }}
            >
              {active && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    top: "18%",
                    height: "64%",
                    width: "2px",
                    bgcolor: "primary.main",
                    borderRadius: "0 2px 2px 0",
                  }}
                />
              )}
              <ArticleOutlinedIcon
                sx={{
                  fontSize: 12,
                  color: active ? "primary.main" : "text.disabled",
                  flexShrink: 0,
                  transition: "color 0.1s",
                }}
              />
              <Typography
                noWrap
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "text.primary" : "text.secondary",
                  transition: "color 0.1s",
                }}
              >
                {d.title || "Untitled"}
              </Typography>
            </Box>
          );
        })}

        {/* New page row — inside the list, like Notion */}
        <Box
          onClick={!creating ? onCreate : undefined}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 0.625,
            mt: 0.5,
            borderRadius: "6px",
            cursor: creating ? "default" : "pointer",
            opacity: creating ? 0.45 : 1,
            transition: "all 0.1s ease",
            "&:hover": {
              bgcolor: creating
                ? undefined
                : (t) => t.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            },
          }}
        >
          <AddRoundedIcon sx={{ fontSize: 12, color: "text.disabled", flexShrink: 0 }} />
          <Typography sx={{ fontSize: "0.8rem", color: "text.disabled" }}>
            New page
          </Typography>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 0.25,
        }}
      >
        <ThemeToggle />
        <Tooltip title="Sign out">
          <IconButton
            size="small"
            onClick={handleSignOut}
            sx={{ color: "text.disabled", "&:hover": { color: "text.primary" } }}
          >
            <LogoutRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
