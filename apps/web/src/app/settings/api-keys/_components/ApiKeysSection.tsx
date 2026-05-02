"use client";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { ApiKeysCard } from "./ApiKeysCard";
import { useCredentials } from "./useCredentials";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function ApiKeysSection() {
  const user = useCurrentUser();
  const {
    state,
    saving,
    saveUser,
    removeUser,
    saveWorkspace,
    removeWorkspace,
    saveSerperUser,
    removeSerperUser,
    saveSerperWorkspace,
    removeSerperWorkspace,
  } = useCredentials();

  if (!state || !user) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <ApiKeysCard
        title="Personal key"
        description="Used for your own AI requests. Stored encrypted, never shared."
        info={state.user}
        onSave={saveUser}
        onRemove={removeUser}
        saving={saving}
      />
      <ApiKeysCard
        title="Workspace key"
        description="Used by members who haven't set their own key. Admins only."
        info={state.workspace}
        disabled={!user.isAdmin}
        disabledReason={
          user.isAdmin
            ? undefined
            : "Only workspace admins can set a shared key."
        }
        onSave={saveWorkspace}
        onRemove={removeWorkspace}
        saving={saving}
      />

      <Divider sx={{ my: 1 }} />

      <Box>
        <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, mb: 0.5 }}>
          Serper (web search)
        </Typography>
        <Typography
          sx={{ fontSize: "0.82rem", color: "text.secondary", mb: 2 }}
        >
          Powers the Fact check feature. Get a key at{" "}
          <Box
            component="a"
            href="https://serper.dev"
            target="_blank"
            rel="noreferrer"
            sx={{
              color: "primary.main",
              textDecoration: "none",
              borderBottom: "1px solid",
              borderColor: "primary.main",
              "&:hover": { opacity: 0.75 },
            }}
          >
            serper.dev
          </Box>
          .
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <ApiKeysCard
            title="Personal Serper key"
            description="Used for your own fact-check requests."
            placeholder="serper-key"
            info={state.serper_user}
            onSave={saveSerperUser}
            onRemove={removeSerperUser}
            saving={saving}
          />
          <ApiKeysCard
            title="Workspace Serper key"
            description="Shared fallback for members without a personal key. Admins only."
            placeholder="serper-key"
            info={state.serper_workspace}
            disabled={!user.isAdmin}
            disabledReason={
              user.isAdmin
                ? undefined
                : "Only workspace admins can set a shared key."
            }
            onSave={saveSerperWorkspace}
            onRemove={removeSerperWorkspace}
            saving={saving}
          />
        </Box>
      </Box>
    </Box>
  );
}
