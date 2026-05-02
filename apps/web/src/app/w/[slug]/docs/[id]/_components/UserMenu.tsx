"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import type { CurrentUser } from "@/hooks/useCurrentUser";

interface Props {
  user: CurrentUser;
}

export function UserMenu({ user }: Props) {
  const handleSignOut = async () => {
    await fetch("/api/backend/api/v1/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.25,
        flex: 1,
        minWidth: 0,
      }}
    >
      <Typography
        noWrap
        sx={{
          fontSize: "0.72rem",
          fontWeight: 600,
          color: "text.secondary",
          opacity: 0.75,
          flex: 1,
          minWidth: 0,
          px: 0.75,
        }}
      >
        {user.name || user.email}
      </Typography>
      <Tooltip title="Settings">
        <IconButton
          size="small"
          component={Link}
          href="/settings/profile"
          sx={(theme) => ({
            width: 26,
            height: 26,
            color: "text.secondary",
            opacity: 0.55,
            transition: "opacity 0.15s",
            "&:hover": { opacity: 1 },
            ...theme.applyStyles("dark", { opacity: 0.5 }),
          })}
        >
          <SettingsRoundedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Sign out">
        <IconButton
          size="small"
          onClick={handleSignOut}
          sx={(theme) => ({
            width: 26,
            height: 26,
            color: "text.secondary",
            opacity: 0.55,
            transition: "opacity 0.15s",
            "&:hover": { opacity: 1 },
            ...theme.applyStyles("dark", { opacity: 0.5 }),
          })}
        >
          <LogoutRoundedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
