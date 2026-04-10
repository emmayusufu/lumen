"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
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
        bgcolor: (t) => t.palette.mode === "dark" ? "#202020" : "#F7F6F3",
        borderRight: "1px solid",
        borderColor: "divider",
        height: "100vh",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5 }}>
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: "5px",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AutoAwesomeIcon sx={{ color: "white", fontSize: 12 }} />
        </Box>
        <Typography fontWeight={700} fontSize="0.875rem" letterSpacing="-0.01em" noWrap>
          Lumen
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 1, py: 0.5 }}>
        {docs.map((d) => (
          <Box
            key={d.id}
            onClick={() => router.push(`/docs/${d.id}`)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              py: 0.5,
              borderRadius: "5px",
              cursor: "pointer",
              bgcolor: d.id === currentId
                ? (t) => t.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"
                : "transparent",
              "&:hover": {
                bgcolor: d.id === currentId
                  ? undefined
                  : (t) => t.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
              },
            }}
          >
            <ArticleOutlinedIcon sx={{ fontSize: 13, color: "text.secondary", flexShrink: 0 }} />
            <Typography
              noWrap
              sx={{ fontSize: "0.875rem", fontWeight: d.id === currentId ? 600 : 400, color: "text.primary" }}
            >
              {d.title || "Untitled"}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          px: 1.5,
          py: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Tooltip title="New page">
          <span>
            <IconButton size="small" onClick={onCreate} disabled={creating}
              sx={{ color: "text.secondary", "&:hover": { color: "text.primary", bgcolor: "action.hover" } }}>
              <AddRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ThemeToggle />
          <Tooltip title="Sign out">
            <IconButton size="small" onClick={handleSignOut}
              sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}>
              <LogoutRoundedIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}
