"use client";

import { useState, useCallback, useEffect } from "react";
import type { Session } from "@/lib/types";
import { fetchSessions, deleteSession as apiDeleteSession } from "@/lib/api";

interface UseSessionsReturn {
  sessions: Session[];
  refresh: () => Promise<void>;
  removeSession: (id: string) => Promise<void>;
}

export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await fetchSessions();
        setSessions(data);
      } catch {
        // non-fatal
      }
    };
    void loadSessions();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchSessions();
      setSessions(data);
    } catch {
      // non-fatal
    }
  }, []);

  const removeSession = useCallback(
    async (id: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      try {
        await apiDeleteSession(id);
      } catch {
        await refresh();
      }
    },
    [refresh],
  );

  return { sessions, refresh, removeSession };
}
