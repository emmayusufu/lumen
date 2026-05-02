"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { FormInput } from "@repo/ui";
import { usePassword } from "./usePassword";

export function PasswordForm() {
  const { submit, saving, error, success } = usePassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const mismatch = next.length > 0 && confirm.length > 0 && next !== confirm;
  const canSubmit =
    current.length > 0 && next.length >= 8 && !mismatch && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await submit(current, next);
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 480 }}
    >
      <FormInput
        label="Current password"
        type="password"
        placeholder="Enter your current password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <FormInput
        label="New password"
        type="password"
        placeholder="Minimum 8 characters"
        helperText="At least 8 characters"
        value={next}
        onChange={(e) => setNext(e.target.value)}
      />
      <FormInput
        label="Confirm new password"
        type="password"
        placeholder="Re-enter the new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={mismatch}
        errorText={mismatch ? "Passwords do not match" : undefined}
      />
      {error && (
        <Typography sx={{ fontSize: "0.78rem", color: "error.main" }}>
          {error}
        </Typography>
      )}
      {success && (
        <Typography sx={{ fontSize: "0.78rem", color: "primary.main" }}>
          Password changed.
        </Typography>
      )}
      <Box>
        <Button
          type="submit"
          variant="contained"
          disabled={!canSubmit}
          sx={{ boxShadow: "none", "&:hover": { boxShadow: "none" } }}
        >
          {saving ? "Saving…" : "Change password"}
        </Button>
      </Box>
    </Box>
  );
}
