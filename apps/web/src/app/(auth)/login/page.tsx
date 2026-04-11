"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { FormInput } from "@/components/shared/FormInput";

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
      const data = await res.json();
      setError(data.detail ?? "Invalid credentials");
      setLoading(false);
      return;
    }
    window.location.href = "/";
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Left branding panel */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "flex-end",
          width: "44%",
          flexShrink: 0,
          p: 7,
          position: "relative",
          overflow: "hidden",
          bgcolor: (t) => t.palette.primary.main,
        }}
      >
        {/* Decorative rings */}
        {[360, 500, 640].map((size, i) => (
          <Box
            key={size}
            sx={{
              position: "absolute",
              top: -size * 0.28,
              right: -size * 0.28,
              width: size,
              height: size,
              borderRadius: "50%",
              border: "1px solid",
              borderColor: `rgba(255,255,255,${0.12 - i * 0.03})`,
              pointerEvents: "none",
            }}
          />
        ))}
        {/* Ghost letter */}
        <Typography
          sx={{
            position: "absolute",
            right: -24,
            bottom: -40,
            fontSize: "22rem",
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.05em",
            color: "rgba(0,0,0,0.06)",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          L
        </Typography>

        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", mb: 2.5 }}>
          Lumen
        </Typography>
        <Typography
          variant="h3"
          fontWeight={800}
          letterSpacing="-0.04em"
          sx={{ color: "white", lineHeight: 1.08 }}
        >
          Write with<br />intention.
        </Typography>
        <Typography sx={{ mt: 2, color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", lineHeight: 1.75, maxWidth: 280 }}>
          A focused workspace for thinking,<br />researching, and writing well.
        </Typography>
      </Box>

      {/* Right form panel */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          px: { xs: 3, sm: 6 },
          py: 6,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 360 }}>
          {/* Mobile-only wordmark */}
          <Typography
            fontWeight={800}
            fontSize="1rem"
            letterSpacing="0.06em"
            sx={{ display: { md: "none" }, textTransform: "uppercase", mb: 6 }}
          >
            Lumen
          </Typography>

          <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" mb={0.75}>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={4} lineHeight={1.6}>
            Sign in to continue to your workspace.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }}>
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
              endIcon={loading ? <CircularProgress size={15} color="inherit" /> : <ArrowForwardIcon />}
              sx={{ borderRadius: "10px", py: 1.4, fontWeight: 700, mt: 0.5 }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
            No account?{" "}
            <Box component="a" href="/signup" sx={{ color: "primary.main", fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
              Create one
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
