"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import { SectionHeading } from "../_components/SectionHeading";
import { SubsectionLabel } from "../_components/SubsectionLabel";
import { useThemeContext } from "@/app/providers";

type ThemeKey = "light" | "dark";

const CHOICES: Array<{
  key: ThemeKey;
  label: string;
  hint: string;
  preview: { paper: string; ink: string; accent: string };
}> = [
  {
    key: "light",
    label: "Parchment",
    hint: "Warm cream for daylight reading.",
    preview: { paper: "#EEE8D8", ink: "#2A2520", accent: "#8B9B6E" },
  },
  {
    key: "dark",
    label: "Inkwell",
    hint: "Deep olive-black for late nights.",
    preview: { paper: "#121006", ink: "#EBE6D9", accent: "#BAC8A0" },
  },
];

export default function AppearancePage() {
  const { isDark, toggleTheme } = useThemeContext();
  const current: ThemeKey = isDark ? "dark" : "light";

  const pick = (k: ThemeKey) => {
    if (k !== current) toggleTheme();
  };

  return (
    <Box sx={{ maxWidth: 640, mx: "auto", width: "100%" }}>
      <SectionHeading
        Icon={PaletteOutlinedIcon}
        title="Appearance"
        description="How Lumen looks to you. Choose the surface that&rsquo;s easiest on your eyes. The change takes effect immediately and syncs across tabs."
      />

      <SubsectionLabel title="Theme" description="Pick one." />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2.5,
        }}
      >
        {CHOICES.map((c) => {
          const active = c.key === current;
          return (
            <Box
              key={c.key}
              onClick={() => pick(c.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  pick(c.key);
                }
              }}
              sx={{
                position: "relative",
                cursor: "pointer",
                borderRadius: "12px",
                border: "1.5px solid",
                borderColor: active ? "primary.main" : "divider",
                backgroundColor: "background.paper",
                overflow: "hidden",
                transition:
                  "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  borderColor: active ? "primary.main" : "text.disabled",
                  transform: "translateY(-2px)",
                },
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                  outlineOffset: "2px",
                },
              }}
            >
              <Box
                aria-hidden
                sx={{
                  height: 110,
                  backgroundColor: c.preview.paper,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    width: "62%",
                    height: "62%",
                    borderRadius: "6px",
                    backgroundColor: "rgba(255,255,255,0.35)",
                    backdropFilter: "blur(2px)",
                    border: "1px solid",
                    borderColor:
                      c.key === "dark"
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(42, 37, 32, 0.08)",
                    p: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <Box
                    sx={{
                      height: 5,
                      width: "60%",
                      borderRadius: "2px",
                      backgroundColor: c.preview.ink,
                      opacity: 0.85,
                    }}
                  />
                  <Box
                    sx={{
                      height: 3,
                      width: "90%",
                      borderRadius: "2px",
                      backgroundColor: c.preview.ink,
                      opacity: 0.35,
                    }}
                  />
                  <Box
                    sx={{
                      height: 3,
                      width: "78%",
                      borderRadius: "2px",
                      backgroundColor: c.preview.ink,
                      opacity: 0.35,
                    }}
                  />
                  <Box sx={{ flex: 1 }} />
                  <Box
                    sx={{
                      height: 7,
                      width: 28,
                      borderRadius: "3px",
                      backgroundColor: c.preview.accent,
                    }}
                  />
                </Box>

                {active && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      backgroundColor: "primary.main",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    }}
                  >
                    <CheckRoundedIcon sx={{ fontSize: 15 }} />
                  </Box>
                )}
              </Box>

              <Box sx={{ px: 2.5, py: 2 }}>
                <Typography
                  sx={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    mb: 0.25,
                  }}
                >
                  {c.label}
                </Typography>
                <Typography
                  sx={{ fontSize: "0.78rem", color: "text.secondary" }}
                >
                  {c.hint}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
