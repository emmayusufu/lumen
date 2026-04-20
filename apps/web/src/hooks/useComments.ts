"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type CommentThread,
  fetchComments,
  createCommentThread,
  replyToCommentThread,
  setCommentResolved,
  deleteCommentThread,
} from "@/lib/api";

export function useComments(docId: string) {
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchComments(docId);
      setThreads(next);
      setLoaded(true);
    } catch {
      // non-fatal
    }
  }, [docId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createThread = useCallback(
    async (threadId: string, body: string) => {
      await createCommentThread(docId, threadId, body);
      await refresh();
    },
    [docId, refresh],
  );

  const reply = useCallback(
    async (threadId: string, body: string) => {
      await replyToCommentThread(threadId, body);
      await refresh();
    },
    [refresh],
  );

  const resolve = useCallback(
    async (threadId: string, resolved: boolean) => {
      await setCommentResolved(threadId, resolved);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (threadId: string) => {
      await deleteCommentThread(threadId);
      await refresh();
    },
    [refresh],
  );

  return { threads, loaded, createThread, reply, resolve, remove, refresh };
}
