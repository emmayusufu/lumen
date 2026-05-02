"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

export function CTA() {
  return (
    <Box
      component="section"
      sx={{
        px: { xs: 3, md: 8 },
        py: { xs: 10, md: 16 },
        textAlign: "center",
        borderTop: "1px solid",
        borderColor: "divider",
        maxWidth: 720,
        mx: "auto",
      }}
    >
      <Typography
        component="h2"
        sx={{
          fontSize: { xs: "2rem", md: "3rem" },
          fontWeight: 900,
          lineHeight: 1.05,
          mb: 2,
        }}
      >
        Ready to write?
      </Typography>
      <Typography
        sx={{
          fontSize: "1.05rem",
          color: "text.secondary",
          mb: 5,
          lineHeight: 1.6,
        }}
      >
        Free to use. Self-host in minutes with Docker Compose. No card required.
      </Typography>
      <Button
        component={Link}
        href="/signup"
        variant="contained"
        size="large"
        endIcon={<ArrowForwardRoundedIcon />}
        sx={{
          fontSize: "1rem",
          px: 4,
          py: 1.75,
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        }}
      >
        Create your workspace
      </Button>
    </Box>
  );
}
