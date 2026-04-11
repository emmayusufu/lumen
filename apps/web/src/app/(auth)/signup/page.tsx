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
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
        py: 4,
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
        <Box sx={{ mb: 5 }}>
          <Typography fontWeight={800} fontSize="1.1rem" letterSpacing="-0.02em">
            Lumen
          </Typography>
        </Box>

        <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" sx={{ mb: 0.75 }}>
          Create your workspace
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Get started in seconds
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
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
            size="large"
            fullWidth
            endIcon={loading ? undefined : <ArrowForwardIcon />}
            disabled={loading}
            sx={{
              py: 1.5,
              mt: 0.5,
              fontSize: "0.95rem",
              fontWeight: 700,
              borderRadius: "14px",
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
  );
}
