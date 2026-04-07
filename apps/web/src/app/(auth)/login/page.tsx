"use client";

import { signIn } from "next-auth/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 3, sm: 5 },
          borderRadius: "20px",
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          boxShadow: (t) =>
            t.palette.mode === "dark"
              ? "0 8px 40px rgba(0,0,0,0.4)"
              : "0 8px 40px rgba(0,0,0,0.06)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(30,58,138,0.35)",
            }}
          >
            <AutoAwesomeIcon sx={{ color: "white", fontSize: 18 }} />
          </Box>
          <Typography fontWeight={800} fontSize="1.1rem" letterSpacing="-0.02em">
            Lumen
          </Typography>
        </Box>

        <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" sx={{ mb: 0.75 }}>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Sign in to continue
        </Typography>

        <Button
          variant="contained"
          size="large"
          fullWidth
          endIcon={<ArrowForwardIcon />}
          onClick={() => signIn("zitadel", { callbackUrl: "/" })}
          sx={{
            py: 1.5,
            fontSize: "0.95rem",
            fontWeight: 700,
            borderRadius: "14px",
            boxShadow: "0 4px 20px rgba(30,58,138,0.3)",
            "&:hover": {
              boxShadow: "0 6px 24px rgba(30,58,138,0.4)",
              transform: "translateY(-1px)",
            },
            transition: "all 0.2s ease",
          }}
        >
          Sign In
        </Button>

        <Box
          sx={{ mt: 4, pt: 4, borderTop: 1, borderColor: "divider", textAlign: "center" }}
        >
          <Typography variant="body2" color="text.secondary">
            Don&apos;t have an account?{" "}
            <Box
              component="a"
              href="/signup"
              sx={{
                color: "primary.main",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Create one
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
