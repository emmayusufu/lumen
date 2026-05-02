"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FormInput } from "@repo/ui";
import { acceptInvite, previewInvite, signupViaInvite } from "@/lib/api";

interface Props {
  params: Promise<{ token: string }>;
}

type Preview = {
  workspace_name: string;
  workspace_slug: string;
  role: string;
  inviter_name: string | null;
  expired: boolean;
};

export default function InvitePage({ params }: Props) {
  const { token } = use(params);
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null | "not-found">(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const p = await previewInvite(token);
      setPreview(p ?? "not-found");
    })();
    fetch("/api/backend/api/v1/workspaces")
      .then((r) => setLoggedIn(r.ok))
      .catch(() => setLoggedIn(false));
  }, [token]);

  if (preview === null || loggedIn === null) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 10 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (preview === "not-found") {
    return (
      <Box sx={{ p: 10, textAlign: "center" }}>
        <Typography variant="h5">Invite not found.</Typography>
      </Box>
    );
  }
  if (preview.expired) {
    return (
      <Box sx={{ p: 10, textAlign: "center" }}>
        <Typography variant="h5">This invite has expired.</Typography>
      </Box>
    );
  }

  const onAcceptLoggedIn = async () => {
    setBusy(true);
    try {
      const ws = await acceptInvite(token);
      router.push(`/w/${ws.slug}/docs`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await signupViaInvite(token, signupForm);
      const data = res as { workspace: { slug: string } };
      router.push(`/w/${data.workspace.slug}/docs`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 520, mx: "auto", p: 4, pt: 10 }}>
      <Stack spacing={2} alignItems="center">
        <Typography sx={{ fontSize: "0.9rem", color: "text.secondary" }}>
          You&apos;re invited
        </Typography>
        <Typography variant="h4" sx={{ textAlign: "center", fontWeight: 800 }}>
          to join &ldquo;{preview.workspace_name}&rdquo; as {preview.role}
        </Typography>
        {preview.inviter_name && (
          <Typography sx={{ color: "text.secondary" }}>
            invited by {preview.inviter_name}
          </Typography>
        )}
      </Stack>

      <Box sx={{ mt: 5 }}>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {loggedIn ? (
          <Button
            fullWidth
            variant="contained"
            onClick={onAcceptLoggedIn}
            disabled={busy}
          >
            {busy ? "Joining…" : "Accept and join"}
          </Button>
        ) : (
          <Stack component="form" spacing={2} onSubmit={onSignup}>
            <Typography sx={{ fontSize: "0.88rem", color: "text.secondary" }}>
              Sign up to join {preview.workspace_name}
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <FormInput
                label="First name"
                required
                value={signupForm.firstName}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, firstName: e.target.value })
                }
              />
              <FormInput
                label="Last name"
                required
                value={signupForm.lastName}
                onChange={(e) =>
                  setSignupForm({ ...signupForm, lastName: e.target.value })
                }
              />
            </Box>
            <FormInput
              label="Work email"
              required
              type="email"
              value={signupForm.email}
              onChange={(e) =>
                setSignupForm({ ...signupForm, email: e.target.value })
              }
            />
            <FormInput
              label="Password"
              required
              type="password"
              placeholder="Min. 8 characters"
              value={signupForm.password}
              onChange={(e) =>
                setSignupForm({ ...signupForm, password: e.target.value })
              }
            />
            <Button type="submit" variant="contained" disabled={busy}>
              {busy ? "Joining…" : "Sign up and join"}
            </Button>
            <Typography
              sx={{
                fontSize: "0.82rem",
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              Already have an account?{" "}
              <a href={`/login?next=/invite/${token}`}>Log in</a>
            </Typography>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
