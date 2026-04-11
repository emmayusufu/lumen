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

export default function SignupPage() {
  const [form, setForm] = useState({
    orgName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/backend/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.detail ?? data.error ?? "Something went wrong");
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
          Your workspace<br />starts here.
        </Typography>
        <Typography sx={{ mt: 2, color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", lineHeight: 1.75, maxWidth: 280 }}>
          Set up your team in seconds.<br />Start writing immediately.
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
          overflowY: "auto",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 360 }}>
          <Typography
            fontWeight={800}
            fontSize="1rem"
            letterSpacing="0.06em"
            sx={{ display: { md: "none" }, textTransform: "uppercase", mb: 6 }}
          >
            Lumen
          </Typography>

          <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" mb={0.75}>
            Create your workspace
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={4} lineHeight={1.6}>
            Get your team up and running in seconds.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }}>
              {error}
            </Alert>
          )}

          <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
            <FormInput
              label="Organisation name"
              placeholder="Acme Corp"
              value={form.orgName}
              onChange={set("orgName")}
              required
            />

            <Box sx={{ display: "flex", gap: 1.5 }}>
              <FormInput
                label="First name"
                placeholder="Alice"
                value={form.firstName}
                onChange={set("firstName")}
                required
              />
              <FormInput
                label="Last name"
                placeholder="Smith"
                value={form.lastName}
                onChange={set("lastName")}
                required
              />
            </Box>

            <FormInput
              label="Work email"
              type="email"
              placeholder="alice@acmecorp.com"
              value={form.email}
              onChange={set("email")}
              required
            />

            <FormInput
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set("password")}
              required
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              endIcon={loading ? undefined : <ArrowForwardIcon />}
              disabled={loading}
              sx={{
                py: 1.5,
                mt: 0.5,
                fontWeight: 700,
                borderRadius: "10px",
                boxShadow: "0 4px 20px rgba(163,176,135,0.3)",
                "&:hover:not(:disabled)": {
                  boxShadow: "0 6px 24px rgba(163,176,135,0.4)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
              }}
            >
              {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Create workspace"}
            </Button>
          </Stack>

          <Box sx={{ mt: 4, pt: 4, borderTop: 1, borderColor: "divider", textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{" "}
              <Box
                component="a"
                href="/login"
                sx={{ color: "primary.main", fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                Sign in
              </Box>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
