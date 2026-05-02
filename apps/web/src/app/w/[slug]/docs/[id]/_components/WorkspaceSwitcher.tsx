"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { FormInput, menuPaperSx } from "@repo/ui";
import { createWorkspace } from "@/lib/api";
import { useWorkspaces } from "@/hooks/useWorkspaces";

interface Props {
  currentSlug: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || name[0] || "W";
}

export function WorkspaceSwitcher({ currentSlug }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { workspaces, refresh } = useWorkspaces();
  const router = useRouter();

  const current = workspaces.find((w) => w.slug === currentSlug);
  const open = Boolean(anchor);

  const close = () => {
    setAnchor(null);
    setShowCreate(false);
    setNewName("");
    setError(null);
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const ws = await createWorkspace(name);
      await refresh();
      close();
      router.push(`/w/${ws.slug}/docs`);
    } catch (err) {
      setError((err as Error).message || "Could not create workspace");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Box
        id="tour-workspace-switcher"
        onClick={(e) => setAnchor(e.currentTarget)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setAnchor(e.currentTarget as HTMLElement);
          }
        }}
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.25,
          py: 1,
          cursor: "pointer",
          borderRadius: "8px",
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: open ? "rgba(42, 37, 32, 0.04)" : "transparent",
          transition: "background-color 0.15s",
          "&:hover": {
            backgroundColor: "rgba(42, 37, 32, 0.04)",
          },
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: "2px",
          },
          ...theme.applyStyles("dark", {
            backgroundColor: open ? "rgba(235, 230, 217, 0.05)" : "transparent",
            "&:hover": {
              backgroundColor: "rgba(235, 230, 217, 0.05)",
            },
          }),
        })}
      >
        <Box
          aria-hidden
          sx={(theme) => ({
            width: 26,
            height: 26,
            borderRadius: "6px",
            backgroundColor: "primary.main",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.72rem",
            fontWeight: 800,
            flexShrink: 0,
            ...theme.applyStyles("dark", { color: "#1a1810" }),
          })}
        >
          {initials(current?.name ?? "W")}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            noWrap
            sx={{ fontSize: "0.92rem", fontWeight: 700, lineHeight: 1.15 }}
          >
            {current?.name ?? "Workspace"}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.7rem",
              color: "text.secondary",
              lineHeight: 1.1,
              textTransform: "capitalize",
            }}
          >
            {current?.role ?? ""}
          </Typography>
        </Box>
        <KeyboardArrowDownRoundedIcon
          sx={{
            fontSize: 18,
            color: "text.secondary",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0)",
            flexShrink: 0,
          }}
        />
      </Box>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: (theme) => ({
              ...menuPaperSx(theme),
              p: 2,
              py: 2,
              width: { xs: "calc(100vw - 24px)", sm: 320 },
              maxWidth: 360,
              minWidth: undefined,
            }),
          },
        }}
      >
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "text.disabled",
            mb: 1.25,
          }}
        >
          Your workspaces
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
          {workspaces.map((w) => {
            const active = w.slug === currentSlug;
            return (
              <Box
                key={w.id}
                onClick={() => {
                  if (!active) {
                    close();
                    router.push(`/w/${w.slug}/docs`);
                  }
                }}
                sx={(theme) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  px: 1,
                  py: 1,
                  borderRadius: "6px",
                  cursor: active ? "default" : "pointer",
                  "&:hover": active
                    ? undefined
                    : {
                        backgroundColor: "rgba(42, 37, 32, 0.04)",
                      },
                  ...theme.applyStyles("dark", {
                    "&:hover": active
                      ? undefined
                      : { backgroundColor: "rgba(235, 230, 217, 0.05)" },
                  }),
                })}
              >
                <Box
                  aria-hidden
                  sx={(theme) => ({
                    width: 24,
                    height: 24,
                    borderRadius: "5px",
                    backgroundColor: active
                      ? "primary.main"
                      : "rgba(42, 37, 32, 0.06)",
                    color: active ? "#fff" : "text.secondary",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    flexShrink: 0,
                    ...theme.applyStyles("dark", {
                      backgroundColor: active
                        ? "primary.main"
                        : "rgba(235, 230, 217, 0.07)",
                      color: active ? "#1a1810" : "text.secondary",
                    }),
                  })}
                >
                  {initials(w.name)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    noWrap
                    sx={{
                      fontSize: "0.86rem",
                      fontWeight: 600,
                      lineHeight: 1.2,
                    }}
                  >
                    {w.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      color: "text.secondary",
                      textTransform: "capitalize",
                    }}
                  >
                    {w.role}
                  </Typography>
                </Box>
                {active && (
                  <CheckRoundedIcon
                    sx={{ fontSize: 16, color: "primary.main", flexShrink: 0 }}
                  />
                )}
              </Box>
            );
          })}
        </Box>

        {showCreate ? (
          <Box component="form" onSubmit={onCreate}>
            <FormInput
              label="New workspace name"
              placeholder="e.g. Side Project"
              value={newName}
              autoFocus
              onChange={(e) => setNewName(e.target.value)}
              error={!!error}
              errorText={error ?? undefined}
            />
            <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
              <Button
                type="submit"
                variant="contained"
                size="small"
                disabled={!newName.trim() || creating}
                sx={{ boxShadow: "none", "&:hover": { boxShadow: "none" } }}
              >
                {creating ? "Creating…" : "Create"}
              </Button>
              <Button
                type="button"
                size="small"
                onClick={() => {
                  setShowCreate(false);
                  setNewName("");
                  setError(null);
                }}
                sx={{ color: "text.secondary" }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              pt: 1,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              onClick={() => setShowCreate(true)}
              sx={(theme) => ({
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1,
                py: 1,
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.86rem",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "rgba(42, 37, 32, 0.04)",
                },
                ...theme.applyStyles("dark", {
                  "&:hover": {
                    backgroundColor: "rgba(235, 230, 217, 0.05)",
                  },
                }),
              })}
            >
              <AddRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              Create workspace
            </Box>

            {current?.role === "admin" && (
              <Box
                onClick={() => {
                  close();
                  router.push(`/w/${currentSlug}/settings/members`);
                }}
                sx={(theme) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1,
                  py: 1,
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.86rem",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "rgba(42, 37, 32, 0.04)",
                  },
                  ...theme.applyStyles("dark", {
                    "&:hover": {
                      backgroundColor: "rgba(235, 230, 217, 0.05)",
                    },
                  }),
                })}
              >
                <SettingsOutlinedIcon
                  sx={{ fontSize: 16, color: "text.secondary" }}
                />
                Workspace settings
              </Box>
            )}
          </Box>
        )}
      </Popover>
    </>
  );
}
