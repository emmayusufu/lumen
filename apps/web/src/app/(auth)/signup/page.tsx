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
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import BusinessIcon from "@mui/icons-material/Business";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

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
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      fontSize: "0.9rem",
    },
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "background.default" }}>
      {/* Left panel — form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, sm: 6, md: 8 },
          py: 6,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 6, alignSelf: { xs: "center", md: "flex-start" } }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TravelExploreIcon sx={{ color: "white", fontSize: 20 }} />
          </Box>
          <Typography fontWeight={800} fontSize="1.1rem">
            Research
          </Typography>
        </Box>

        <Box sx={{ width: "100%", maxWidth: 420 }}>
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" sx={{ mb: 0.75 }}>
            Create your workspace
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Set up your organisation and get started in seconds
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
              <Grid size={6}>
                <TextField
                  label="First name"
                  value={form.firstName}
                  onChange={set("firstName")}
                  required
                  fullWidth
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
              <Grid size={6}>
                <TextField
                  label="Last name"
                  value={form.lastName}
                  onChange={set("lastName")}
                  required
                  fullWidth
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
              disabled={loading}
              sx={{
                py: 1.5,
                mt: 1,
                fontSize: "0.95rem",
                fontWeight: 700,
                borderRadius: "14px",
                boxShadow: "0 4px 20px rgba(13,148,136,0.3)",
                "&:hover:not(:disabled)": {
                  boxShadow: "0 6px 24px rgba(13,148,136,0.4)",
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

          <Box sx={{ mt: 4, textAlign: "center" }}>
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

      {/* Right panel — branding */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "40%",
          px: 6,
          background: (t) =>
            t.palette.mode === "dark"
              ? "linear-gradient(145deg, #042f2e 0%, #0d2137 60%, #0b1120 100%)"
              : "linear-gradient(145deg, #ccfbf1 0%, #e0f2fe 60%, #f0fdfa 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {[
          { size: 300, top: -60, left: -80, opacity: 0.07 },
          { size: 180, bottom: 80, right: -50, opacity: 0.06 },
        ].map((c, i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: c.size,
              height: c.size,
              borderRadius: "50%",
              border: "1.5px solid",
              borderColor: "primary.main",
              opacity: c.opacity,
              top: c.top,
              bottom: c.bottom,
              left: c.left,
              right: c.right,
              pointerEvents: "none",
            }}
          />
        ))}

        <Box sx={{ textAlign: "center", maxWidth: 300, position: "relative" }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "20px",
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
              boxShadow: "0 8px 32px rgba(13,148,136,0.35)",
            }}
          >
            <TravelExploreIcon sx={{ color: "white", fontSize: 38 }} />
          </Box>
          <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" sx={{ mb: 2 }}>
            Your team's research,{" "}
            <Box component="span" sx={{ color: "primary.main" }}>
              accelerated.
            </Box>
          </Typography>
          <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
            Every organisation gets its own isolated workspace. Invite teammates, share research threads, and build a knowledge base — all in one place.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
