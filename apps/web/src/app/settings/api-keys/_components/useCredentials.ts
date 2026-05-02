"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import {
  deleteSerperUserCredential,
  deleteSerperWorkspaceCredential,
  deleteUserCredential,
  deleteWorkspaceCredential,
  fetchCredentials,
  setSerperUserCredential,
  setSerperWorkspaceCredential,
  setUserCredential,
  setWorkspaceCredential,
} from "@/lib/api";
import type { CredentialsState } from "@/lib/types";

export function useCredentials() {
  const { data, mutate } = useSWR<CredentialsState>(
    "/api/v1/settings/credentials",
    fetchCredentials,
  );
  const [saving, setSaving] = useState(false);

  const wrap = useCallback(
    async (op: () => Promise<unknown>) => {
      setSaving(true);
      try {
        await op();
        await mutate();
      } finally {
        setSaving(false);
      }
    },
    [mutate],
  );

  return {
    state: data ?? null,
    saving,
    saveUser: (k: string) => wrap(() => setUserCredential(k)),
    removeUser: () => wrap(deleteUserCredential),
    saveWorkspace: (k: string) => wrap(() => setWorkspaceCredential(k)),
    removeWorkspace: () => wrap(deleteWorkspaceCredential),
    saveSerperUser: (k: string) => wrap(() => setSerperUserCredential(k)),
    removeSerperUser: () => wrap(deleteSerperUserCredential),
    saveSerperWorkspace: (k: string) =>
      wrap(() => setSerperWorkspaceCredential(k)),
    removeSerperWorkspace: () => wrap(deleteSerperWorkspaceCredential),
  };
}
