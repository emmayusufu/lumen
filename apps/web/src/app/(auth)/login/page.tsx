"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { FormInput } from "@repo/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/backend/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const text = await res.text();
      let detail = "Invalid credentials";
      try {
        detail = (JSON.parse(text) as { detail?: string }).detail ?? detail;
      } catch {}
      setError(detail);
      setLoading(false);
      return;
    }
    try {
      const wsRes = await fetch("/api/backend/api/v1/workspaces", {
        credentials: "include",
      });
      if (wsRes.ok) {
        const list = (await wsRes.json()) as Array<{ slug: string }>;
        if (list.length > 0) {
          window.location.href = `/w/${list[0].slug}/docs`;
          return;
        }
      }
    } catch {}
    window.location.href = "/";
  };

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        bgcolor: "background.default",
        px: 3,
        py: 6,
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(135, 131, 120, 0.10) 1px, transparent 0)",
        backgroundSize: "32px 32px",
        ...theme.applyStyles("dark", {
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
        }),
      })}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          px: { xs: 4, sm: 5 },
          py: { xs: 5, sm: 6 },
        }}
      >
        <Typography
          sx={{
            fontSize: "1.05rem",
            fontWeight: 900,
            mb: 4,
          }}
        >
          Lumen
        </Typography>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            letterSpacing: "-0.02em",
            mb: 0.5,
            lineHeight: 1.1,
          }}
        >
          Welcome back.
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 4, lineHeight: 1.6, fontSize: "0.92rem" }}
        >
          Sign in to continue to your workspace.
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 0,
              border: "none",
              borderLeft: "2px solid",
              borderColor: "error.main",
              backgroundColor: "transparent",
              py: 0.5,
              px: 1.5,
              fontSize: "0.85rem",
              "& .MuiAlert-icon": { display: "none" },
            }}
          >
            {error}
          </Alert>
        )}

        <Stack component="form" onSubmit={handleSubmit} spacing={2.5}>
          <FormInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FormInput
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            endIcon={
              loading ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <ArrowForwardIcon sx={{ fontSize: 16 }} />
              )
            }
            sx={{
              fontWeight: 700,
              fontSize: "0.92rem",
              py: 1.4,
              mt: 1,
              boxShadow: "none",
              borderRadius: "8px",
              "&:hover": { boxShadow: "none" },
            }}
          >
            {loading ? "Signing in" : "Sign in"}
          </Button>
        </Stack>

        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: "1px solid rgba(135, 131, 120, 0.18)",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            New here?{" "}
            <Box
              component="a"
              href="/signup"
              sx={{
                color: "primary.main",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": { opacity: 0.7 },
              }}
            >
              Create a workspace →
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
