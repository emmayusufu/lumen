"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

const CONFIRMATION_PHRASE = "delete my account";

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    if (submitting) return;
    setOpen(false);
    setPhrase("");
    setError("");
  };

  const confirm = async () => {
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/backend/api/v1/auth/me", {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.detail ?? "Failed to delete account.");
      setSubmitting(false);
      return;
    }
    window.location.href = "/";
  };

  return (
    <>
      <Box>
        <Typography
          sx={{
            fontSize: "1.05rem",
            fontWeight: 700,
            mb: 0.75,
            color: "error.main",
          }}
        >
          Delete account
        </Typography>
        <Typography
          sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 2 }}
        >
          Permanently scrub your name, email, and password. Workspaces you
          created alone will be deleted along with their docs. Shared workspaces
          remain with your contributions attributed to a deleted user. This
          cannot be undone.
        </Typography>
        <Button
          variant="contained"
          color="error"
          size="medium"
          onClick={() => setOpen(true)}
          sx={{ fontWeight: 600 }}
        >
          Delete my account
        </Button>
      </Box>

      <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete account?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.9rem", mb: 2 }}>
            Type{" "}
            <Box component="code" sx={{ fontWeight: 700 }}>
              {CONFIRMATION_PHRASE}
            </Box>{" "}
            to confirm.
          </Typography>
          <TextField
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder={CONFIRMATION_PHRASE}
            fullWidth
            size="small"
            autoFocus
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={close}
            disabled={submitting}
            variant="outlined"
            color="error"
          >
            Cancel
          </Button>
          <Button
            onClick={confirm}
            color="error"
            variant="contained"
            disabled={phrase !== CONFIRMATION_PHRASE || submitting}
            sx={{ boxShadow: "none", "&:hover": { boxShadow: "none" } }}
          >
            {submitting ? "Deleting…" : "Delete account"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
