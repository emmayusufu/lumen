"use client";

import { useEffect, useRef, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cursorColor } from "./editor/collaborationCursor";

const COLLAB_URL = process.env.NEXT_PUBLIC_COLLAB_URL ?? "ws://localhost:1234";

export function useCollabProvider(docId: string) {
  const [wsToken, setWsToken] = useState<string | null>(null);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [synced, setSynced] = useState(false);
  const user = useCurrentUser();
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    fetch("/api/backend/api/v1/auth/ws-token")
      .then((r) => r.json())
      .then((d: { token: string }) => setWsToken(d.token))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!wsToken) return;
    const p = new HocuspocusProvider({
      url: COLLAB_URL,
      name: docId,
      token: wsToken,
      onSynced: () => setSynced(true),
    });
    const u = userRef.current;
    if (u) {
      p.awareness?.setLocalStateField("user", {
        name: u.name,
        color: cursorColor(u.id),
      });
    }
    setProvider(p);
    if (process.env.NODE_ENV === "development") {
      (
        window as unknown as { __collabProvider?: HocuspocusProvider }
      ).__collabProvider = p;
    }
    return () => {
      p.destroy();
      setProvider(null);
      setSynced(false);
    };
  }, [wsToken, docId]);

  useEffect(() => {
    if (!provider?.awareness || !user) return;
    provider.awareness.setLocalStateField("user", {
      name: user.name,
      color: cursorColor(user.id),
    });
  }, [provider, user]);

  return { provider, synced };
}
