"use client";

import { useState, useCallback, useEffect } from "react";
import type { DocDetail } from "@/lib/types";
import {
  fetchDoc,
  updateDoc as apiUpdateDoc,
  addCollaborator as apiAddCollaborator,
  removeCollaborator as apiRemoveCollaborator,
} from "@/lib/api";

interface UseDocReturn {
  doc: DocDetail | null;
  saveTitle: (title: string) => Promise<void>;
  saveContent: (content: string) => Promise<void>;
  addCollaborator: (email: string, role: "editor" | "viewer") => Promise<void>;
  removeCollaborator: (userId: string) => Promise<void>;
  saveError: string | null;
  clearSaveError: () => void;
}

export function useDoc(id: string): UseDocReturn {
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchDoc(id);
        setDoc(data);
      } catch {
        // non-fatal
      }
    };
    void load();
  }, [id]);

  const saveTitle = useCallback(
    async (title: string) => {
      setSaveError(null);
      let prev: DocDetail | null = null;
      setDoc((d) => {
        prev = d;
        return d ? { ...d, title } : d;
      });
      try {
        await apiUpdateDoc(id, { title });
      } catch {
        setDoc(prev);
        setSaveError("Failed to save");
      }
    },
    [id],
  );

  const saveContent = useCallback(
    async (content: string) => {
      setSaveError(null);
      let prev: DocDetail | null = null;
      setDoc((d) => {
        prev = d;
        return d ? { ...d, content } : d;
      });
      try {
        await apiUpdateDoc(id, { content });
      } catch {
        setDoc(prev);
        setSaveError("Failed to save");
      }
    },
    [id],
  );

  const addCollaborator = useCallback(
    async (email: string, role: "editor" | "viewer") => {
      await apiAddCollaborator(id, email, role);
      const updated = await fetchDoc(id);
      setDoc(updated);
    },
    [id],
  );

  const removeCollaborator = useCallback(
    async (userId: string) => {
      let prev: DocDetail | null = null;
      setDoc((d) => {
        prev = d;
        return d
          ? { ...d, collaborators: d.collaborators.filter((c) => c.user_id !== userId) }
          : d;
      });
      try {
        await apiRemoveCollaborator(id, userId);
      } catch {
        setDoc(prev);
      }
    },
    [id],
  );

  const clearSaveError = useCallback(() => setSaveError(null), []);

  return { doc, saveTitle, saveContent, addCollaborator, removeCollaborator, saveError, clearSaveError };
}
