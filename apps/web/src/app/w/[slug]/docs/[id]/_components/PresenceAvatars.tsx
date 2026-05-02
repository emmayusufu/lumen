"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import type { HocuspocusProvider } from "@hocuspocus/provider";

interface PresenceUser {
  clientId: number;
  name: string;
  color: string;
}

interface Props {
  provider: HocuspocusProvider | null;
  currentUserName?: string;
}

const INITIALS = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "?";

export function PresenceAvatars({ provider, currentUserName }: Props) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!provider?.awareness) return;
    const awareness = provider.awareness;
    const update = () => {
      const list: PresenceUser[] = [];
      awareness.states.forEach((state, clientId) => {
        const u = (state as { user?: { name?: string; color?: string } }).user;
        if (u?.name && u.color) {
          list.push({ clientId, name: u.name, color: u.color });
        }
      });
      setUsers(list);
    };
    update();
    awareness.on("change", update);
    return () => {
      awareness.off("change", update);
    };
  }, [provider]);

  const unique = Array.from(
    new Map(users.map((u) => [u.name, u])).values(),
  ).filter((u) => u.name !== currentUserName);
  const visible = unique.slice(0, 4);
  const overflow = unique.length - visible.length;

  if (visible.length === 0 && overflow === 0) return null;

  return (
    <Box sx={{ display: "flex", alignItems: "center", ml: -0.5 }}>
      {visible.map((u) => (
        <Tooltip key={u.clientId} title={u.name} arrow>
          <Box
            sx={(theme) => ({
              width: 26,
              height: 26,
              borderRadius: "50%",
              backgroundColor: u.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "white",
              border: "2px solid",
              borderColor: "background.paper",
              ml: -0.75,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              cursor: "default",
              ...theme.applyStyles("dark", { borderColor: "background.paper" }),
            })}
          >
            {INITIALS(u.name)}
          </Box>
        </Tooltip>
      ))}
      {overflow > 0 && (
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            backgroundColor: "text.disabled",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "background.paper",
            border: "2px solid",
            borderColor: "background.paper",
            ml: -0.75,
          }}
        >
          +{overflow}
        </Box>
      )}
    </Box>
  );
}
