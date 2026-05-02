"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

interface Props {
  authed: boolean | null;
  workspaceSlug: string | null;
}

export function Nav({ authed, workspaceSlug }: Props) {
  return (
    <Box
      component="nav"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: { xs: 3, md: 8 },
        py: 2.5,
        borderBottom: "1px solid",
        borderColor: "divider",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "inherit",
        backdropFilter: "blur(12px)",
      }}
    >
      <Typography sx={{ fontSize: "1.35rem", fontWeight: 900, lineHeight: 1 }}>
        Lumen
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {authed && workspaceSlug ? (
          <Button
            component={Link}
            href={`/w/${workspaceSlug}/docs`}
            variant="contained"
            endIcon={
              <ArrowForwardRoundedIcon sx={{ fontSize: "16px !important" }} />
            }
            sx={{
              fontSize: "0.875rem",
              fontWeight: 700,
              px: 2.5,
              py: 0.875,
              boxShadow: "none",
              "&:hover": { boxShadow: "none" },
            }}
          >
            Open workspace
          </Button>
        ) : (
          <>
            <Button
              component={Link}
              href="/login"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                px: 2,
                py: 0.875,
                color: "text.secondary",
              }}
            >
              Sign in
            </Button>
            <Button
              component={Link}
              href="/signup"
              variant="contained"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 700,
                px: 2.5,
                py: 0.875,
                boxShadow: "none",
                "&:hover": { boxShadow: "none" },
              }}
            >
              Get started
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
