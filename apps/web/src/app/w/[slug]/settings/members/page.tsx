"use client";

import { use, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { MembersList } from "./_components/MembersList";
import { InviteModal } from "./_components/InviteModal";
import { InvitesList } from "./_components/InvitesList";
import { WorkspaceNameForm } from "./_components/WorkspaceNameForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function WorkspaceMembersPage({ params }: Props) {
  const { slug } = use(params);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", p: 4 }}>
      <Box
        component={Link}
        href={`/w/${slug}/docs`}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          fontSize: "0.88rem",
          fontWeight: 500,
          color: "text.secondary",
          textDecoration: "none",
          opacity: 0.75,
          mb: 3,
          transition: "opacity 0.2s",
          "&:hover": { opacity: 1, color: "text.primary" },
        }}
      >
        <ArrowBackRoundedIcon sx={{ fontSize: 16 }} />
        Back to docs
      </Box>
      <Typography variant="h5" sx={{ mb: 4, fontWeight: 800 }}>
        Workspace settings
      </Typography>

      <Box sx={{ mb: 5 }}>
        <Typography sx={{ fontSize: "1.02rem", fontWeight: 700, mb: 0.5 }}>
          General
        </Typography>
        <Typography
          sx={{ fontSize: "0.82rem", color: "text.secondary", mb: 2.5 }}
        >
          The name appears in the sidebar and in invite previews. Admins only.
        </Typography>
        <WorkspaceNameForm slug={slug} />
      </Box>

      <Box
        sx={{
          pt: 5,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography sx={{ fontSize: "1.02rem", fontWeight: 700 }}>
            Members
          </Typography>
          <Button variant="contained" onClick={() => setInviteOpen(true)}>
            Invite
          </Button>
        </Box>
        <MembersList slug={slug} />
      </Box>

      <Box
        sx={{
          mt: 5,
          pt: 5,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography sx={{ fontSize: "1.02rem", fontWeight: 700, mb: 1.5 }}>
          Outstanding invites
        </Typography>
        <InvitesList slug={slug} refreshKey={refreshKey} />
      </Box>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        slug={slug}
        onMinted={() => setRefreshKey((k) => k + 1)}
      />
    </Box>
  );
}
