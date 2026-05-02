"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { fetchProfile, updateProfile } from "@/lib/api";
import type { Profile } from "@/lib/types";

export function useSettingsProfile() {
  const { data, error, mutate } = useSWR<Profile>(
    "/api/v1/settings/profile",
    fetchProfile,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    async (patch: {
      name?: string;
      email?: string;
      current_password?: string;
    }) => {
      setSaveError(null);
      setSaving(true);
      try {
        await updateProfile(patch);
        await mutate();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Save failed";
        setSaveError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [mutate],
  );

  return {
    profile: data ?? null,
    save,
    error: saveError ?? (error ? error.message : null),
    saving,
  };
}
