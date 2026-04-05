"use client";

import { useState, useCallback, useEffect } from "react";
import type { Doc } from "@/lib/types";
import {
  fetchDocs,
  createDoc as apiCreateDoc,
  deleteDoc as apiDeleteDoc,
} from "@/lib/api";

interface UseDocsReturn {
  docs: Doc[];
  createDoc: (title?: string) => Promise<string>;
  removeDoc: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDocs(): UseDocsReturn {
  const [docs, setDocs] = useState<Doc[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchDocs();
        setDocs(data);
      } catch {
        // non-fatal
      }
    };
    void load();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchDocs();
      setDocs(data);
    } catch {
      // non-fatal
    }
  }, []);

  const createDoc = useCallback(
    async (title = "Untitled") => {
      const { id } = await apiCreateDoc(title);
      await refresh();
      return id;
    },
    [refresh],
  );

  const removeDoc = useCallback(
    async (id: string) => {
      setDocs((prev) => prev.filter((d) => d.id !== id));
      try {
        await apiDeleteDoc(id);
      } catch {
        await refresh();
      }
    },
    [refresh],
  );

  return { docs, createDoc, removeDoc, refresh };
}
