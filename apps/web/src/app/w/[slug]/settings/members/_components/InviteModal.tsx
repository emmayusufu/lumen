"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { mintInvite } from "@/lib/api";
import { FormSelect } from "@repo/ui";

interface Props {
  open: boolean;
  onClose: () => void;
  slug: string;
  onMinted: () => void;
}

export function InviteModal({ open, onClose, slug, onMinted }: Props) {
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const onCreate = async () => {
    setBusy(true);
    try {
      const invite = await mintInvite(slug, role);
      setUrl(invite.url);
      onMinted();
    } finally {
      setBusy(false);
    }
  };

  const onCopy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleClose = () => {
    setUrl(null);
    setRole("editor");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Invite to workspace</DialogTitle>
      <DialogContent>
        {!url ? (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormSelect
              label="Role"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "admin" | "editor" | "viewer")
              }
            >
              <MenuItem value="admin">
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                    Admin
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.72rem", color: "text.secondary" }}
                  >
                    Can manage members, invites, and workspace settings
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="editor">
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                    Editor
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.72rem", color: "text.secondary" }}
                  >
                    Can create and edit workspace docs
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="viewer">
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                    Viewer
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.72rem", color: "text.secondary" }}
                  >
                    Read-only access
                  </Typography>
                </Box>
              </MenuItem>
            </FormSelect>
          </Stack>
        ) : (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="body2">
              Share this link (valid for 14 days, single use):
            </Typography>
            <TextField value={url} fullWidth InputProps={{ readOnly: true }} />
            <Button onClick={onCopy} variant="outlined">
              {copied ? "Copied ✓" : "Copy link"}
            </Button>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined" color="error">
          Close
        </Button>
        {!url && (
          <Button onClick={onCreate} variant="contained" disabled={busy}>
            {busy ? "Creating…" : "Create link"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
