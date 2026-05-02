"use client";

import useSWR from "swr";
import { fetchWorkspaces } from "@/lib/api";
import type { Workspace } from "@/lib/types";

export function useWorkspaces() {
  const { data, isLoading, mutate } = useSWR<Workspace[]>(
    "/api/v1/workspaces",
    fetchWorkspaces,
  );
  return {
    workspaces: data ?? [],
    loading: isLoading,
    refresh: () => mutate(),
  };
}
