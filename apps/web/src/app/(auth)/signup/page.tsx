"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

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

    const res = await fetch("/api/org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    await signIn("zitadel", { callbackUrl: "/dashboard" });
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Stack spacing={3} sx={{ width: 400, p: 4 }}>
        <Typography variant="h5" fontWeight={700}>
          Create your organization
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <Stack component="form" spacing={1.5} onSubmit={handleSubmit}>
          <TextField
            label="Organization name"
            value={form.orgName}
            onChange={set("orgName")}
            required
            fullWidth
          />
          <TextField
            label="First name"
            value={form.firstName}
            onChange={set("firstName")}
            required
            fullWidth
          />
          <TextField
            label="Last name"
            value={form.lastName}
            onChange={set("lastName")}
            required
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={set("email")}
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={set("password")}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={loading} fullWidth>
            {loading ? "Creating…" : "Create organization"}
          </Button>
        </Stack>
        <Typography variant="body2" textAlign="center">
          Already have an account?{" "}
          <Box component="a" href="/login" sx={{ color: "primary.main" }}>
            Sign in
          </Box>
        </Typography>
      </Stack>
    </Box>
  );
}
