"use client";

import { useCallback } from "react";
import useSWR from "swr";
import type { Doc } from "@/lib/types";
import {
  fetchDocs,
  createDocInWorkspace,
  deleteDoc as apiDeleteDoc,
  moveDoc as apiMoveDoc,
} from "@/lib/api";

interface UseDocsReturn {
  docs: Doc[];
  createDoc: (
    title?: string,
    parentId?: string | null,
  ) => Promise<{ id: string; workspace_slug: string }>;
  removeDoc: (id: string) => Promise<void>;
  moveDoc: (id: string, parentId: string | null) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDocs(workspaceSlug?: string): UseDocsReturn {
  const key = workspaceSlug ? `/api/v1/content/docs?ws=${workspaceSlug}` : null;
  const { data, mutate } = useSWR<Doc[]>(key, () => fetchDocs(workspaceSlug));
  const docs = data ?? [];

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const createDoc = useCallback(
    async (title = "Untitled", parentId: string | null = null) => {
      if (!workspaceSlug) throw new Error("workspace slug required");
      const result = await createDocInWorkspace(workspaceSlug, title, parentId);
      await mutate();
      return result;
    },
    [workspaceSlug, mutate],
  );

  const removeDoc = useCallback(
    async (id: string) => {
      await mutate(
        async (current) => {
          try {
            await apiDeleteDoc(id);
          } catch (err) {
            console.error("failed to delete doc", id, err);
            return current;
          }
          return (current ?? []).filter(
            (d) => d.id !== id && d.parent_id !== id,
          );
        },
        {
          optimisticData: docs.filter((d) => d.id !== id && d.parent_id !== id),
        },
      );
    },
    [mutate, docs],
  );

  const moveDoc = useCallback(
    async (id: string, parentId: string | null) => {
      await mutate(
        async (current) => {
          try {
            await apiMoveDoc(id, parentId);
          } catch (err) {
            console.error("failed to move doc", id, err);
            return current;
          }
          return (current ?? []).map((d) =>
            d.id === id ? { ...d, parent_id: parentId } : d,
          );
        },
        {
          optimisticData: docs.map((d) =>
            d.id === id ? { ...d, parent_id: parentId } : d,
          ),
        },
      );
    },
    [mutate, docs],
  );

  return { docs, createDoc, removeDoc, moveDoc, refresh };
}
