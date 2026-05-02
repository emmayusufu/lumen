"use client";

import { createContext, useContext } from "react";

export interface DocShell {
  openSidebar: () => void;
  refreshDocs: () => Promise<void>;
}

export const DocShellContext = createContext<DocShell | null>(null);

export function useDocShell(): DocShell {
  const ctx = useContext(DocShellContext);
  if (!ctx) {
    return { openSidebar: () => {}, refreshDocs: async () => {} };
  }
  return ctx;
}
