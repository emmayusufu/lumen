"use client";

import { useCallback } from "react";
import useSWR from "swr";
import {
  bulkRemoveCollaborator,
  fetchMyCollaborators,
  removeCollaborator,
  updateCollaboratorRole,
} from "@/lib/api";
import type { CollaboratorSummary, DocCollaboratorRole } from "@/lib/types";

export function useMyCollaborators() {
  const { data, isLoading, mutate } = useSWR<CollaboratorSummary[]>(
    "/api/v1/content/collaborators/my",
    fetchMyCollaborators,
  );

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const removeFromAll = useCallback(
    async (userId: string) => {
      await bulkRemoveCollaborator(userId);
      await mutate();
    },
    [mutate],
  );

  const removeFromSingleDoc = useCallback(
    async (docId: string, userId: string) => {
      await removeCollaborator(docId, userId);
      await mutate();
    },
    [mutate],
  );

  const updateRoleOnDoc = useCallback(
    async (docId: string, userId: string, role: DocCollaboratorRole) => {
      await updateCollaboratorRole(docId, userId, role);
      await mutate();
    },
    [mutate],
  );

  return {
    list: data ?? [],
    loading: isLoading,
    removeFromAll,
    removeFromSingleDoc,
    updateRoleOnDoc,
    refresh,
  };
}
