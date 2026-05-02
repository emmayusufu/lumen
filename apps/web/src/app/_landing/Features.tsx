"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const FEATURES = [
  {
    Icon: GroupsRoundedIcon,
    title: "Real-time collaboration",
    body: "Multiple people, one document — edits merge instantly via Yjs CRDTs. Live cursors show exactly where everyone is. No refreshing, no conflicts.",
  },
  {
    Icon: AutoAwesomeRoundedIcon,
    title: "AI that edits your writing",
    body: "Select any passage and hit AI: Improve, Shorten, Fix grammar, Change tone, or type a custom instruction. Responses stream token-by-token. You keep control.",
  },
  {
    Icon: FactCheckOutlinedIcon,
    title: "Fact-check against the web",
    body: "Coming soon — the editor will extract your claims, search the web for each one, and flag what's confirmed, disputed, or unverifiable. With source links.",
  },
  {
    Icon: LockOutlinedIcon,
    title: "Self-hosted, your data",
    body: "Docker Compose gets you running in minutes. Postgres, MinIO, and Redis stay on your infrastructure. No SaaS vendor, no data leaving your network.",
  },
];

export function Features() {
  return (
    <Box
      component="section"
      sx={{
        px: { xs: 3, md: 8 },
        pb: { xs: 10, md: 16 },
        maxWidth: 1200,
        mx: "auto",
      }}
    >
      <Typography
        sx={{
          fontSize: "0.76rem",
          fontWeight: 700,
          color: "primary.main",
          mb: 2,
        }}
      >
        What you get
      </Typography>
      <Typography
        component="h2"
        sx={{
          fontSize: { xs: "2rem", md: "2.8rem" },
          fontWeight: 900,
          lineHeight: 1.1,
          mb: 8,
          maxWidth: 560,
        }}
      >
        Everything a writing team needs
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 4,
        }}
      >
        {FEATURES.map(({ Icon, title, body }) => (
          <Box key={title}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "10px",
                backgroundColor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <Icon sx={{ fontSize: 22, color: "#fff" }} />
            </Box>
            <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, mb: 1 }}>
              {title}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.95rem",
                color: "text.secondary",
                lineHeight: 1.65,
              }}
            >
              {body}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
