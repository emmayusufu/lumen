"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteUserCredential,
  deleteWorkspaceCredential,
  fetchCredentials,
  setUserCredential,
  setWorkspaceCredential,
} from "@/lib/api";
import type { CredentialsState } from "@/lib/types";

export function useCredentials() {
  const [state, setState] = useState<CredentialsState | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setState(await fetchCredentials());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveUser = useCallback(
    async (apiKey: string) => {
      setSaving(true);
      try {
        await setUserCredential(apiKey);
        await refresh();
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const removeUser = useCallback(async () => {
    setSaving(true);
    try {
      await deleteUserCredential();
      await refresh();
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const saveWorkspace = useCallback(
    async (apiKey: string) => {
      setSaving(true);
      try {
        await setWorkspaceCredential(apiKey);
        await refresh();
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const removeWorkspace = useCallback(async () => {
    setSaving(true);
    try {
      await deleteWorkspaceCredential();
      await refresh();
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  return { state, saving, saveUser, removeUser, saveWorkspace, removeWorkspace };
}
