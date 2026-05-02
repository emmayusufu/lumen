"use client";

import { useState } from "react";
import useSWR from "swr";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import { changeMemberRole, fetchMembers, removeMember } from "@/lib/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { FormSelect } from "@repo/ui";
import type { WorkspaceRole } from "@/lib/types";

interface Member {
  user_id: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  joined_at: string;
}

export function MembersList({ slug }: { slug: string }) {
  const {
    data,
    error: fetchError,
    mutate,
  } = useSWR<Member[]>(
    `/api/v1/w/${slug}/members`,
    () => fetchMembers(slug) as Promise<Member[]>,
  );
  const members = data ?? [];
  const [opError, setOpError] = useState<string | null>(null);
  const error = opError ?? (fetchError ? (fetchError as Error).message : null);
  const setError = setOpError;
  const [pendingRemoval, setPendingRemoval] = useState<Member | null>(null);
  const [removing, setRemoving] = useState(false);
  const me = useCurrentUser();

  const onRoleChange = async (userId: string, role: WorkspaceRole) => {
    try {
      await changeMemberRole(slug, userId, role);
      await mutate();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const confirmRemove = async () => {
    if (!pendingRemoval) return;
    setRemoving(true);
    try {
      await removeMember(slug, pendingRemoval.user_id);
      await mutate();
      setPendingRemoval(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRemoving(false);
    }
  };

  const myRole = members.find((x) => x.user_id === me?.id)?.role;
  const canManage = myRole === "admin";

  return (
    <Box>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      {members.map((m) => {
        const isMe = me?.id === m.user_id;
        return (
          <Box
            key={m.user_id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              py: 1.75,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: "0.92rem", fontWeight: 600 }} noWrap>
                {m.name?.trim() || m.email}
                {isMe && (
                  <Box
                    component="span"
                    sx={{
                      ml: 1,
                      fontSize: "0.7rem",
                      fontWeight: 500,
                      color: "text.disabled",
                    }}
                  >
                    you
                  </Box>
                )}
              </Typography>
              {m.name?.trim() && m.email && m.email !== m.name && (
                <Typography
                  noWrap
                  sx={{ fontSize: "0.82rem", color: "text.secondary" }}
                >
                  {m.email}
                </Typography>
              )}
            </Box>

            {canManage ? (
              <>
                <Box sx={{ width: 140 }}>
                  <FormSelect
                    value={m.role}
                    onChange={(e) =>
                      onRoleChange(m.user_id, e.target.value as WorkspaceRole)
                    }
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="editor">Editor</MenuItem>
                    <MenuItem value="viewer">Viewer</MenuItem>
                  </FormSelect>
                </Box>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<PersonRemoveRoundedIcon sx={{ fontSize: 18 }} />}
                  disabled={isMe}
                  onClick={() => setPendingRemoval(m)}
                  sx={{
                    fontWeight: 500,
                    borderRadius: "8px",
                    boxShadow: "none",
                    "&:hover": { boxShadow: "none" },
                  }}
                >
                  Remove
                </Button>
              </>
            ) : (
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  color: "text.secondary",
                  textTransform: "capitalize",
                  px: 1,
                }}
              >
                {m.role}
              </Typography>
            )}
          </Box>
        );
      })}

      <Dialog
        open={Boolean(pendingRemoval)}
        onClose={() => !removing && setPendingRemoval(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Remove member?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.92rem" }}>
            {pendingRemoval?.name || pendingRemoval?.email} will lose access to
            this workspace immediately. Their docs in shared workspaces stay
            intact and remain attributed to them.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setPendingRemoval(null)}
            disabled={removing}
            variant="outlined"
            color="error"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmRemove}
            color="error"
            variant="contained"
            disabled={removing}
            sx={{
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}
          >
            {removing ? "Removing…" : "Remove member"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
