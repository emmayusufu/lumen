"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BusinessIcon from "@mui/icons-material/Business";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

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
    await signIn("zitadel", { callbackUrl: "/" });
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": { borderRadius: "12px", fontSize: "0.9rem" },
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

        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <TextField
            label="Organisation name"
            value={form.orgName}
            onChange={set("orgName")}
            required
            fullWidth
            placeholder="Acme Corp"
            sx={inputSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <BusinessIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Grid container spacing={1.5}>
            <Grid xs={6}>
              <TextField
                label="First name"
                value={form.firstName}
                onChange={set("firstName")}
                required
                fullWidth
                placeholder="Alice"
                sx={inputSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid xs={6}>
              <TextField
                label="Last name"
                value={form.lastName}
                onChange={set("lastName")}
                required
                fullWidth
                placeholder="Smith"
                sx={inputSx}
              />
            </Grid>
          </Grid>

          <TextField
            label="Work email"
            type="email"
            value={form.email}
            onChange={set("email")}
            required
            fullWidth
            placeholder="alice@acmecorp.com"
            sx={inputSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={set("password")}
            required
            fullWidth
            placeholder="Min. 8 characters"
            sx={inputSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                  </InputAdornment>
                ),
              },
            }}
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
              mt: 1,
              fontSize: "0.95rem",
              fontWeight: 700,
              borderRadius: "14px",
              boxShadow: "0 4px 20px rgba(30,58,138,0.3)",
              "&:hover:not(:disabled)": {
                boxShadow: "0 6px 24px rgba(30,58,138,0.4)",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Create workspace"
            )}
          </Button>
        </Stack>

        <Box
          sx={{ mt: 4, pt: 4, borderTop: 1, borderColor: "divider", textAlign: "center" }}
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
                "&:hover": { textDecoration: "underline" },
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
