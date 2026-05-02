"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

export default function NotFound() {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ghost number */}
      <Typography
        sx={{
          position: "absolute",
          fontSize: "clamp(18rem, 35vw, 32rem)",
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-0.06em",
          color: "text.primary",
          opacity: 0.04,
          userSelect: "none",
          pointerEvents: "none",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        404
      </Typography>

      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          maxWidth: 400,
          px: 4,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.65rem",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "primary.main",
            mb: 2,
          }}
        >
          Page not found
        </Typography>

        <Typography
          variant="h4"
          fontWeight={800}
          letterSpacing="-0.03em"
          lineHeight={1.1}
          sx={{ mb: 2 }}
        >
          This page doesn&apos;t exist.
        </Typography>

        <Typography
          sx={{
            fontSize: "0.9rem",
            color: "text.secondary",
            lineHeight: 1.7,
            mb: 4,
          }}
        >
          The link may be broken, or the page may have been moved or deleted.
        </Typography>

        <Button
          component={Link}
          href="/docs"
          variant="contained"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ borderRadius: "10px", py: 1.2, px: 2.5, fontWeight: 700 }}
        >
          Back to docs
        </Button>
      </Box>
    </Box>
  );
}
