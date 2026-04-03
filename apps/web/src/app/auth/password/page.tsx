"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: "12px" } };

function PasswordForm() {
  const params = useSearchParams();
  const authRequestId = params.get("authRequest") ?? "";
  const sessionId = params.get("sessionId") ?? "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/zitadel-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "authenticate", sessionId, authRequestId, password }),
      });
      const data = await res.json() as { callbackUri?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Authentication failed");
        return;
      }
      if (!data.callbackUri) {
        setError("Unexpected error — no callback URI returned");
        return;
      }
      window.location.href = data.callbackUri;
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" sx={{ mb: 0.75 }}>
        Enter your password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Almost there
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
          autoFocus
          sx={{ ...inputSx, mb: 2 }}
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
          disabled={loading || !password}
          endIcon={loading ? undefined : <ArrowForwardIcon />}
          sx={{
            py: 1.5,
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
          {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Sign in"}
        </Button>
      </Box>

      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Box
          component="a"
          href={`/auth?authRequest=${encodeURIComponent(authRequestId)}`}
          sx={{
            color: "primary.main",
            fontWeight: 600,
            fontSize: "0.85rem",
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          ← Use a different email
        </Box>
      </Box>
    </>
  );
}

export default function PasswordPage() {
  return (
    <Suspense fallback={<CircularProgress sx={{ display: "block", mx: "auto", mt: 8 }} />}>
      <PasswordForm />
    </Suspense>
  );
}
