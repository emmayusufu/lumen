"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Doc } from "@/lib/types";

interface Props {
  docs: Doc[];
  currentId: string;
  creating: boolean;
  onCreate: () => void;
}

export function DocSidebar({ docs, currentId, creating, onCreate }: Props) {
  const router = useRouter();
  const user = useCurrentUser();
  const firstName = user?.name?.split(" ")[0] ?? "";

  const handleSignOut = async () => {
    await fetch("/api/backend/api/v1/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <Box
      sx={(theme) => ({
        width: 264,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#EEE8D8",
        height: "100vh",
        position: "relative",
        ...theme.applyStyles("dark", {
          backgroundColor: "#121006",
        }),
      })}
    >
      <Box sx={{ px: 3.5, pt: 3.5, pb: 2 }}>
        <Typography
          sx={{
            fontSize: "1.1rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "text.primary",
            lineHeight: 1,
          }}
        >
          Lumen
        </Typography>
        {firstName && (
          <Typography
            sx={{
              mt: 0.5,
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "text.secondary",
              opacity: 0.7,
            }}
          >
            {firstName}&apos;s workspace
          </Typography>
        )}
      </Box>

      <Box
        className="lumen-draw-line"
        sx={{
          mx: 3.5,
          height: "1px",
          backgroundColor: "divider",
          mb: 2.5,
          animationDelay: "0.15s",
        }}
      />

      <Box
        sx={{
          px: 3.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.25,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "text.secondary",
            opacity: 0.65,
          }}
        >
          Pages
        </Typography>
        <Tooltip title="New page">
          <IconButton
            size="small"
            onClick={!creating ? onCreate : undefined}
            disabled={creating}
            sx={{
              width: 20,
              height: 20,
              color: "text.secondary",
              opacity: 0.55,
              transition: "all 0.2s",
              "&:hover": { opacity: 1, color: "primary.main", transform: "rotate(90deg)" },
            }}
          >
            <AddRoundedIcon sx={{ fontSize: 13 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 1.5, py: 0.5 }}>
        {docs.map((d, i) => {
          const active = d.id === currentId;
          const num = String(i + 1).padStart(2, "0");
          return (
            <Box
              key={d.id}
              className="lumen-rise"
              onClick={() => router.push(`/docs/${d.id}`)}
              sx={(theme) => ({
                animationDelay: `${0.18 + i * 0.025}s`,
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                px: 2,
                py: 1,
                my: 0.25,
                borderRadius: "4px",
                cursor: "pointer",
                transition: "all 0.22s cubic-bezier(0.2, 0.7, 0.3, 1)",
                backgroundColor: active ? "rgba(139, 155, 110, 0.14)" : "transparent",
                "&:hover": {
                  backgroundColor: active ? "rgba(139, 155, 110, 0.18)" : "rgba(42, 37, 32, 0.04)",
                  transform: "translateX(2px)",
                },
                ...theme.applyStyles("dark", {
                  backgroundColor: active ? "rgba(186, 200, 160, 0.13)" : "transparent",
                  "&:hover": {
                    backgroundColor: active ? "rgba(186, 200, 160, 0.18)" : "rgba(235, 230, 217, 0.05)",
                    transform: "translateX(2px)",
                  },
                }),
              })}
            >
              {active && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    bottom: "20%",
                    width: "2px",
                    backgroundColor: "primary.main",
                  }}
                />
              )}
              <Typography
                sx={{
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: active ? "primary.main" : "text.disabled",
                  minWidth: 18,
                  flexShrink: 0,
                  fontVariantNumeric: "tabular-nums",
                  opacity: 0.85,
                }}
              >
                {num}
              </Typography>
              <Typography
                noWrap
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: active ? 600 : 500,
                  letterSpacing: "-0.005em",
                  color: active ? "text.primary" : "text.secondary",
                  lineHeight: 1.3,
                  flex: 1,
                }}
              >
                {d.title || "Untitled"}
              </Typography>
            </Box>
          );
        })}

        <Box
          onClick={!creating ? onCreate : undefined}
          className="lumen-rise"
          sx={(theme) => ({
            animationDelay: `${0.18 + docs.length * 0.025}s`,
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            px: 2,
            py: 1,
            mt: 0.75,
            borderRadius: "4px",
            cursor: creating ? "default" : "pointer",
            opacity: creating ? 0.45 : 0.55,
            transition: "all 0.2s",
            "&:hover": {
              opacity: creating ? 0.45 : 0.9,
              backgroundColor: creating ? undefined : "rgba(42, 37, 32, 0.04)",
            },
            ...theme.applyStyles("dark", {
              "&:hover": {
                backgroundColor: creating ? undefined : "rgba(235, 230, 217, 0.05)",
              },
            }),
          })}
        >
          <AddRoundedIcon
            sx={{
              fontSize: 14,
              color: "text.disabled",
              flexShrink: 0,
              ml: "1px",
            }}
          />
          <Typography
            sx={{
              fontSize: "0.82rem",
              fontWeight: 500,
              color: "text.disabled",
            }}
          >
            New page
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          px: 3.5,
          pt: 2,
          pb: 2.5,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Tooltip title={user?.email ?? ""} placement="top">
          <Typography
            noWrap
            sx={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "text.secondary",
              opacity: 0.7,
              flex: 1,
              minWidth: 0,
            }}
          >
            {user?.email ?? ""}
          </Typography>
        </Tooltip>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
          <ThemeToggle />
          <Tooltip title="Sign out">
            <IconButton
              size="small"
              onClick={handleSignOut}
              sx={{
                width: 26,
                height: 26,
                color: "text.secondary",
                opacity: 0.55,
                transition: "all 0.2s",
                "&:hover": { opacity: 1, color: "text.primary" },
              }}
            >
              <LogoutRoundedIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}
