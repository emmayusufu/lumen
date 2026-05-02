"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import { useWorkspaces } from "@/hooks/useWorkspaces";

const SECTIONS = [
  {
    href: "/settings/profile",
    label: "Profile",
    Icon: PersonOutlineRoundedIcon,
  },
  { href: "/settings/api-keys", label: "API Keys", Icon: VpnKeyOutlinedIcon },
  { href: "/settings/people", label: "People", Icon: GroupsOutlinedIcon },
  {
    href: "/settings/appearance",
    label: "Appearance",
    Icon: PaletteOutlinedIcon,
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();
  const { workspaces } = useWorkspaces();
  const docsHref = workspaces[0] ? `/w/${workspaces[0].slug}/docs` : "/";

  return (
    <Box
      sx={(theme) => ({
        width: 264,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#EEE8D8",
        height: "100vh",
        ...theme.applyStyles("dark", { backgroundColor: "#121006" }),
      })}
    >
      <Box sx={{ px: 4, pt: 4, pb: 3 }}>
        <Box
          component={Link}
          href={docsHref}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            fontSize: "0.82rem",
            fontWeight: 500,
            color: "text.secondary",
            textDecoration: "none",
            opacity: 0.7,
            transition: "opacity 0.2s",
            "&:hover": { opacity: 1, color: "text.primary" },
          }}
        >
          <ArrowBackRoundedIcon sx={{ fontSize: 14 }} />
          Back to docs
        </Box>
      </Box>

      <Box component="nav" sx={{ px: 1.5, flex: 1 }}>
        {SECTIONS.map((s) => {
          const active =
            pathname === s.href || Boolean(pathname?.startsWith(s.href + "/"));
          const Icon = s.Icon;
          return (
            <Box
              key={s.href}
              component={Link}
              href={s.href}
              sx={(theme) => ({
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                px: 2,
                py: 1,
                my: 0.25,
                borderRadius: "4px",
                color: active ? "text.primary" : "text.secondary",
                textDecoration: "none",
                transition: "all 0.22s cubic-bezier(0.2, 0.7, 0.3, 1)",
                backgroundColor: active
                  ? "rgba(139, 155, 110, 0.14)"
                  : "transparent",
                "&:hover": {
                  backgroundColor: active
                    ? "rgba(139, 155, 110, 0.18)"
                    : "rgba(42, 37, 32, 0.04)",
                  transform: "translateX(2px)",
                  color: "text.primary",
                },
                ...theme.applyStyles("dark", {
                  backgroundColor: active
                    ? "rgba(186, 200, 160, 0.13)"
                    : "transparent",
                  "&:hover": {
                    backgroundColor: active
                      ? "rgba(186, 200, 160, 0.18)"
                      : "rgba(235, 230, 217, 0.05)",
                    transform: "translateX(2px)",
                  },
                }),
              })}
            >
              <Icon
                sx={{
                  fontSize: 15,
                  color: active ? "primary.main" : "text.disabled",
                  flexShrink: 0,
                  opacity: active ? 1 : 0.75,
                }}
              />
              <Typography
                noWrap
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: active ? 600 : 500,
                  letterSpacing: "-0.005em",
                  lineHeight: 1.3,
                }}
              >
                {s.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
