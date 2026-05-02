"use client";

import { useCallback, useRef, useState } from "react";
import {
  streamInlineAI,
  type InlineAIRequest,
  type InlineEvent,
} from "@/lib/api";

type InlineAIStatus =
  | "idle"
  | "generating"
  | "preview"
  | "error"
  | "no_credentials";

interface UseInlineAIReturn {
  status: InlineAIStatus;
  draft: string;
  final: string;
  error: string | null;
  run: (req: InlineAIRequest) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useInlineAI(): UseInlineAIReturn {
  const [status, setStatus] = useState<InlineAIStatus>("idle");
  const [draft, setDraft] = useState("");
  const [final, setFinal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (req: InlineAIRequest) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStatus("generating");
    setDraft("");
    setFinal("");
    setError(null);
    try {
      await streamInlineAI(
        req,
        (event: InlineEvent) => {
          if (event.type === "token") {
            setDraft((prev) => prev + event.text);
          } else if (event.type === "draft_complete") {
            setDraft(event.text);
          } else if (event.type === "revision") {
            setFinal(event.text);
          } else if (event.type === "done") {
            setFinal((prev) => prev || event.final || "");
            setStatus("preview");
          } else if (event.type === "error") {
            setError(event.message);
            setStatus("error");
          }
        },
        ctrl.signal,
      );
      setStatus((s) => (s === "generating" ? "preview" : s));
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const code = (err as { code?: string }).code;
      if (code === "no_credentials") {
        setError(
          err instanceof Error ? err.message : "Configure AI in Settings.",
        );
        setStatus("no_credentials");
        return;
      }
      setError(err instanceof Error ? err.message : "Request failed");
      setStatus("error");
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setDraft("");
    setFinal("");
    setError(null);
  }, []);

  return { status, draft, final, error, run, cancel, reset };
}
