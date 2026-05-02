"use client";

import { useCallback } from "react";

const STORAGE_KEY = "lumen_tour_done";

export function useTour() {
  const isDone = () => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return true;
    }
  };

  const markDone = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return { isDone, markDone, reset };
}
