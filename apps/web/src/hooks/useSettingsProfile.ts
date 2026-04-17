"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchProfile, updateProfile } from "@/lib/api";
import type { Profile } from "@/lib/types";

export function useSettingsProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile().then(setProfile).catch((e) => setError(e.message));
  }, []);

  const save = useCallback(
    async (patch: { name?: string; email?: string; current_password?: string }) => {
      setError(null);
      setSaving(true);
      try {
        await updateProfile(patch);
        const next = await fetchProfile();
        setProfile(next);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Save failed";
        setError(message);
        throw new Error(message);
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  return { profile, save, error, saving };
}
