"use client";

import { useCallback, useState } from "react";
import { changePassword } from "@/lib/api";

export function usePassword() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = useCallback(async (current: string, next: string) => {
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      await changePassword({ current_password: current, new_password: next });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Password change failed");
    } finally {
      setSaving(false);
    }
  }, []);

  return { submit, saving, error, success };
}
