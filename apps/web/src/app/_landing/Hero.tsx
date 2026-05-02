"use client";

import Link from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

export function Hero() {
  return (
    <>
      <Box
        component="section"
        sx={{
          px: { xs: 3, md: 8 },
          pt: { xs: 10, md: 16 },
          pb: { xs: 8, md: 12 },
          maxWidth: 1200,
          mx: "auto",
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: "2.8rem", md: "5rem" },
            fontWeight: 900,
            lineHeight: 1.0,
            mb: 3,
            maxWidth: 820,
          }}
        >
          Write together.
          <br />
          Think clearly.
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: "1.05rem", md: "1.25rem" },
            color: "text.secondary",
            maxWidth: 560,
            lineHeight: 1.6,
            mb: 5,
          }}
        >
          A self-hosted document editor with real-time collaboration and AI that
          actually edits your writing — not just autocomplete. Your data, your
          server.
        </Typography>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            component={Link}
            href="/signup"
            variant="contained"
            size="large"
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              fontSize: "1rem",
              px: 3.5,
              py: 1.5,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}
          >
            Start writing free
          </Button>
          <Button
            component="a"
            href="https://github.com/emmayusufu/lumen"
            target="_blank"
            rel="noreferrer"
            size="large"
            variant="outlined"
            sx={{
              fontSize: "1rem",
              px: 3.5,
              py: 1.5,
              borderColor: "divider",
              color: "text.secondary",
              "&:hover": {
                borderColor: "text.disabled",
                color: "text.primary",
              },
            }}
          >
            View on GitHub
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          px: { xs: 1.5, md: 6 },
          pb: { xs: 8, md: 12 },
          maxWidth: 1200,
          mx: "auto",
        }}
      >
        <Box
          sx={{
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 32px 80px rgba(42,37,32,0.12)",
          }}
        >
          <Image
            src="/screenshot-hero.png"
            alt="Lumen document editor with collaboration"
            width={1200}
            height={750}
            style={{ width: "100%", height: "auto", display: "block" }}
            priority
          />
        </Box>
      </Box>
    </>
  );
}
