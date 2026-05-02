"use client";

import { useCallback } from "react";
import useSWR from "swr";
import {
  type CommentThread,
  fetchComments,
  createCommentThread,
  replyToCommentThread,
  setCommentResolved,
  deleteCommentThread,
} from "@/lib/api";

export function useComments(docId: string) {
  const { data, mutate, isLoading } = useSWR<CommentThread[]>(
    docId ? `/api/v1/content/docs/${docId}/comments` : null,
    () => fetchComments(docId),
  );
  const threads = data ?? [];

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const createThread = useCallback(
    async (threadId: string, body: string) => {
      await createCommentThread(docId, threadId, body);
      await mutate();
    },
    [docId, mutate],
  );

  const reply = useCallback(
    async (threadId: string, body: string) => {
      await replyToCommentThread(threadId, body);
      await mutate();
    },
    [mutate],
  );

  const resolve = useCallback(
    async (threadId: string, resolved: boolean) => {
      await setCommentResolved(threadId, resolved);
      await mutate();
    },
    [mutate],
  );

  const remove = useCallback(
    async (threadId: string) => {
      await deleteCommentThread(threadId);
      await mutate();
    },
    [mutate],
  );

  return {
    threads,
    loaded: !isLoading,
    createThread,
    reply,
    resolve,
    remove,
    refresh,
  };
}
