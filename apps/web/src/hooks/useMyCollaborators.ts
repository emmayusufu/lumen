"use client";

import { useCallback, useEffect, useState } from "react";
import {
  bulkRemoveCollaborator,
  fetchMyCollaborators,
  removeCollaborator,
  updateCollaboratorRole,
} from "@/lib/api";
import type { CollaboratorSummary } from "@/lib/types";

export function useMyCollaborators() {
  const [list, setList] = useState<CollaboratorSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setList(await fetchMyCollaborators());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const removeFromAll = useCallback(
    async (userId: string) => {
      await bulkRemoveCollaborator(userId);
      await refresh();
    },
    [refresh],
  );

  const removeFromSingleDoc = useCallback(
    async (docId: string, userId: string) => {
      await removeCollaborator(docId, userId);
      await refresh();
    },
    [refresh],
  );

  const updateRoleOnDoc = useCallback(
    async (docId: string, userId: string, role: "editor" | "viewer") => {
      await updateCollaboratorRole(docId, userId, role);
      await refresh();
    },
    [refresh],
  );

  return { list, loading, removeFromAll, removeFromSingleDoc, updateRoleOnDoc, refresh };
}
