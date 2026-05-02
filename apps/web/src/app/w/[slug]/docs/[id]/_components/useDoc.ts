"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import type { DocDetail, DocCollaboratorRole } from "@/lib/types";
import {
  fetchDoc,
  updateDoc as apiUpdateDoc,
  addCollaborator as apiAddCollaborator,
  removeCollaborator as apiRemoveCollaborator,
  updateCollaboratorRole as apiUpdateCollaboratorRole,
  updateDocVisibility as apiUpdateDocVisibility,
} from "@/lib/api";

interface UseDocReturn {
  doc: DocDetail | null;
  isSaving: boolean;
  saveTitle: (title: string) => Promise<void>;
  saveContent: (content: string) => Promise<void>;
  addCollaborator: (email: string, role: DocCollaboratorRole) => Promise<void>;
  updateCollaboratorRole: (
    userId: string,
    role: DocCollaboratorRole,
  ) => Promise<void>;
  removeCollaborator: (userId: string) => Promise<void>;
  updateVisibility: (visibility: "private" | "workspace") => Promise<void>;
  saveError: string | null;
  clearSaveError: () => void;
}

export function useDoc(id: string): UseDocReturn {
  const { data: doc, mutate } = useSWR<DocDetail>(
    id ? `/api/v1/content/docs/${id}` : null,
    () => fetchDoc(id),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveTitle = useCallback(
    async (title: string) => {
      setSaveError(null);
      try {
        await mutate(
          async () => {
            await apiUpdateDoc(id, { title });
            return doc ? { ...doc, title } : doc;
          },
          { optimisticData: doc ? { ...doc, title } : doc, revalidate: false },
        );
      } catch (err) {
        console.error("saveTitle failed", err);
        setSaveError("Failed to save");
      }
    },
    [id, mutate, doc],
  );

  const saveContent = useCallback(
    async (content: string) => {
      setSaveError(null);
      setIsSaving(true);
      try {
        await mutate(
          async () => {
            await apiUpdateDoc(id, { content });
            return doc ? { ...doc, content } : doc;
          },
          {
            optimisticData: doc ? { ...doc, content } : doc,
            revalidate: false,
          },
        );
      } catch (err) {
        console.error("saveContent failed", err);
        setSaveError("Failed to save");
      } finally {
        setIsSaving(false);
      }
    },
    [id, mutate, doc],
  );

  const addCollaborator = useCallback(
    async (email: string, role: DocCollaboratorRole) => {
      await apiAddCollaborator(id, email, role);
      await mutate();
    },
    [id, mutate],
  );

  const updateCollaboratorRole = useCallback(
    async (userId: string, role: DocCollaboratorRole) => {
      const next = doc
        ? {
            ...doc,
            collaborators: doc.collaborators.map((c) =>
              c.user_id === userId ? { ...c, role } : c,
            ),
          }
        : doc;
      try {
        await mutate(
          async () => {
            await apiUpdateCollaboratorRole(id, userId, role);
            return next;
          },
          { optimisticData: next, revalidate: false },
        );
      } catch (err) {
        console.error("updateCollaboratorRole failed", err);
        await mutate();
      }
    },
    [id, mutate, doc],
  );

  const removeCollaborator = useCallback(
    async (userId: string) => {
      const next = doc
        ? {
            ...doc,
            collaborators: doc.collaborators.filter(
              (c) => c.user_id !== userId,
            ),
          }
        : doc;
      try {
        await mutate(
          async () => {
            await apiRemoveCollaborator(id, userId);
            return next;
          },
          { optimisticData: next, revalidate: false },
        );
      } catch (err) {
        console.error("removeCollaborator failed", err);
        await mutate();
      }
    },
    [id, mutate, doc],
  );

  const updateVisibility = useCallback(
    async (visibility: "private" | "workspace") => {
      const next = doc ? { ...doc, visibility } : doc;
      try {
        await mutate(
          async () => {
            await apiUpdateDocVisibility(id, visibility);
            return next;
          },
          { optimisticData: next, revalidate: false },
        );
      } catch (err) {
        console.error("updateVisibility failed", err);
        setSaveError("Failed to update visibility");
        await mutate();
      }
    },
    [id, mutate, doc],
  );

  const clearSaveError = useCallback(() => setSaveError(null), []);

  return {
    doc: doc ?? null,
    isSaving,
    saveTitle,
    saveContent,
    addCollaborator,
    updateCollaboratorRole,
    removeCollaborator,
    updateVisibility,
    saveError,
    clearSaveError,
  };
}
