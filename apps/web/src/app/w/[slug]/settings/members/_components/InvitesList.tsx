"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { listInvites, revokeInvite } from "@/lib/api";

interface Invite {
  token: string;
  url: string;
  role: string;
  expires_at: string;
}

export function InvitesList({
  slug,
  refreshKey,
}: {
  slug: string;
  refreshKey: number;
}) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const load = async () => {
    const result = (await listInvites(slug)) as Invite[];
    setInvites(result);
  };

  useEffect(() => {
    void load();
  }, [slug, refreshKey]);

  const onCopy = async (invite: Invite) => {
    try {
      await navigator.clipboard.writeText(invite.url);
      setCopiedToken(invite.token);
      setTimeout(() => setCopiedToken(null), 1400);
    } catch {}
  };

  const onRevoke = async (token: string) => {
    await revokeInvite(slug, token);
    await load();
  };

  return (
    <Box>
      {invites.length === 0 && (
        <Typography
          sx={{ color: "text.secondary", fontSize: "0.86rem", py: 2 }}
        >
          No outstanding invites.
        </Typography>
      )}
      {invites.map((i) => {
        const copied = copiedToken === i.token;
        return (
          <Box
            key={i.token}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography sx={{ flex: 1, fontSize: "0.86rem" }}>
              <Box
                component="span"
                sx={{ fontWeight: 600, textTransform: "capitalize" }}
              >
                {i.role}
              </Box>
              <Box
                component="span"
                sx={{ color: "text.secondary", mx: 0.875 }}
              >
                ·
              </Box>
              <Box component="span" sx={{ color: "text.secondary" }}>
                expires {new Date(i.expires_at).toLocaleDateString()}
              </Box>
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={
                copied ? (
                  <CheckRoundedIcon sx={{ fontSize: 16 }} />
                ) : (
                  <ContentCopyOutlinedIcon sx={{ fontSize: 16 }} />
                )
              }
              onClick={() => onCopy(i)}
              sx={{
                fontWeight: 500,
                borderRadius: "8px",
                boxShadow: "none",
                "&:hover": { boxShadow: "none" },
              }}
            >
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button
              data-testid="revoke-invite"
              variant="contained"
              color="error"
              startIcon={<DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />}
              onClick={() => onRevoke(i.token)}
              sx={{
                fontWeight: 500,
                borderRadius: "8px",
                boxShadow: "none",
                "&:hover": { boxShadow: "none" },
              }}
            >
              Revoke
            </Button>
          </Box>
        );
      })}
    </Box>
  );
}
