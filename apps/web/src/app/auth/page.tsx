"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: "12px" } };

function LoginNameForm() {
  const params = useSearchParams();
  const router = useRouter();
  const authRequestId = params.get("authRequest") ?? "";

  const [loginName, setLoginName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/zitadel-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start-session", loginName }),
    });
    const data = await res.json() as { sessionId?: string; error?: string };

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    router.push(
      `/auth/password?authRequest=${encodeURIComponent(authRequestId)}&sessionId=${encodeURIComponent(data.sessionId!)}`
    );
  };

  return (
    <>
      <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" sx={{ mb: 0.75 }}>
        Welcome back
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Enter your email to continue
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          value={loginName}
          onChange={(e) => setLoginName(e.target.value)}
          required
          fullWidth
          autoFocus
          sx={{ ...inputSx, mb: 2 }}
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
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading || !loginName}
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
          {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Continue"}
        </Button>
      </Box>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          New here?{" "}
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
            Create your workspace
          </Box>
        </Typography>
      </Box>
    </>
  );
}

export default function AuthLoginPage() {
  return (
    <Suspense>
      <LoginNameForm />
    </Suspense>
  );
}
