"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const LINK_SX = {
  fontSize: "0.82rem",
  color: "text.secondary",
  textDecoration: "none",
  "&:hover": { color: "text.primary" },
} as const;

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: "1px solid",
        borderColor: "divider",
        px: { xs: 3, md: 8 },
        py: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Typography sx={{ fontSize: "0.95rem", fontWeight: 900 }}>
        Lumen
      </Typography>
      <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
        <Box
          component="a"
          href="https://github.com/emmayusufu/lumen"
          target="_blank"
          rel="noreferrer"
          sx={LINK_SX}
        >
          GitHub
        </Box>
        <Box component={Link} href="/privacy" sx={LINK_SX}>
          Privacy
        </Box>
        <Box component={Link} href="/terms" sx={LINK_SX}>
          Terms
        </Box>
        <Box component={Link} href="/login" sx={LINK_SX}>
          Sign in
        </Box>
        <Typography sx={{ fontSize: "0.78rem", color: "text.disabled" }}>
          MIT License
        </Typography>
      </Box>
    </Box>
  );
}
