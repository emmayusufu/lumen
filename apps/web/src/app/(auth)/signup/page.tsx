"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { FormInput } from "@repo/ui";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    workspaceName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
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
    router.push(`/w/${data.workspace.slug}/docs`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: { xs: 3, sm: 6 },
        py: 6,
        overflowY: "auto",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 380 }}>
        <Typography
          fontWeight={900}
          fontSize="1.05rem"
          letterSpacing="0.02em"
          sx={{ mb: 6 }}
        >
          Lumen
        </Typography>

        <Typography variant="h5" fontWeight={800} mb={0.75}>
          Create your workspace
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          mb={4}
          lineHeight={1.6}
        >
          Get your team up and running in seconds.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }}>
            {error}
          </Alert>
        )}

        <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
          <FormInput
            label="Workspace name"
            placeholder="Acme Corp"
            value={form.workspaceName}
            onChange={set("workspaceName")}
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
            fullWidth
            disabled={loading}
            endIcon={
              loading ? (
                <CircularProgress size={15} color="inherit" />
              ) : (
                <ArrowForwardIcon />
              )
            }
            sx={{ fontWeight: 700, mt: 0.5 }}
          >
            {loading ? "Creating…" : "Create workspace"}
          </Button>

          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontSize: "0.72rem",
              lineHeight: 1.5,
              textAlign: "center",
              mt: 0.5,
            }}
          >
            By creating an account you agree to our{" "}
            <Box
              component="a"
              href="/terms"
              sx={{
                color: "primary.main",
                textDecoration: "none",
                "&:hover": { opacity: 0.7 },
              }}
            >
              Terms
            </Box>{" "}
            and{" "}
            <Box
              component="a"
              href="/privacy"
              sx={{
                color: "primary.main",
                textDecoration: "none",
                "&:hover": { opacity: 0.7 },
              }}
            >
              Privacy Policy
            </Box>
            .
          </Typography>
        </Stack>

        <Box
          sx={{
            mt: 4,
            pt: 4,
            borderTop: 1,
            borderColor: "divider",
            textAlign: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Already have an account?{" "}
            <Box
              component="a"
              href="/login"
              sx={{
                color: "primary.main",
                fontWeight: 600,
                textDecoration: "none",
                "&:hover": { opacity: 0.7 },
              }}
            >
              Sign in
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
