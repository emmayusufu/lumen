"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { FormInput } from "@repo/ui";
import { useSettingsProfile } from "./useSettingsProfile";
import type { Profile } from "@/lib/types";

export function ProfileForm() {
  const { profile, save, saving, error } = useSettingsProfile();
  if (!profile) return null;
  return (
    <ProfileFormInner
      key={profile.id}
      profile={profile}
      save={save}
      saving={saving}
      error={error}
    />
  );
}

interface InnerProps {
  profile: Profile;
  save: (patch: {
    name?: string;
    email?: string;
    current_password?: string;
  }) => Promise<void>;
  saving: boolean;
  error: string | null;
}

function ProfileFormInner({ profile, save, saving, error }: InnerProps) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [currentPassword, setCurrentPassword] = useState("");

  const emailChanged = email !== profile.email;
  const nameChanged = name !== profile.name;
  const canSave =
    (nameChanged || emailChanged) &&
    (emailChanged ? currentPassword.length > 0 : true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const patch: { name?: string; email?: string; current_password?: string } =
      {};
    if (nameChanged) patch.name = name;
    if (emailChanged) {
      patch.email = email;
      patch.current_password = currentPassword;
    }
    try {
      await save(patch);
      setCurrentPassword("");
    } catch {
      /* surfaced via error */
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 480 }}
    >
      <FormInput
        label="Name"
        placeholder="Your full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <FormInput
        label="Email"
        type="email"
        placeholder="you@workspace.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {emailChanged && (
        <FormInput
          label="Current password"
          type="password"
          placeholder="Enter your current password"
          helperText="Required to change your email"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      )}
      {error && (
        <Typography sx={{ fontSize: "0.78rem", color: "error.main" }}>
          {error}
        </Typography>
      )}
      <Box>
        <Button
          type="submit"
          variant="contained"
          disabled={!canSave || saving}
          sx={{ boxShadow: "none", "&:hover": { boxShadow: "none" } }}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </Box>
    </Box>
  );
}
