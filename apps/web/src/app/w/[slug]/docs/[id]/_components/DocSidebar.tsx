"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { UserMenu } from "./UserMenu";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Doc } from "@/lib/types";
import { ancestorIds, buildDocTree } from "./buildDocTree";
import { DocTreeItem } from "./DocTreeItem";

interface Props {
  docs: Doc[];
  currentId: string;
  workspaceSlug: string;
  creating: boolean;
  onCreate: (parentId?: string | null) => void;
  onMove: (docId: string, parentId: string | null) => void;
  onDelete: (docId: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const STORAGE_KEY = (slug: string) => `lumen.expanded.${slug}`;

function loadExpanded(slug: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY(slug));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function DocSidebar({
  docs,
  currentId,
  workspaceSlug,
  creating,
  onCreate,
  onMove,
  onDelete,
  mobileOpen = false,
  onMobileClose,
}: Props) {
  const user = useCurrentUser();
  const firstName = user?.name?.split(" ")[0] ?? "";
  const tree = useMemo(() => buildDocTree(docs), [docs]);

  const [userExpanded, setUserExpanded] = useState<Set<string>>(() =>
    loadExpanded(workspaceSlug),
  );

  const ancestors = useMemo(
    () => new Set(ancestorIds(docs, currentId)),
    [docs, currentId],
  );

  const expanded = useMemo(() => {
    const merged = new Set(userExpanded);
    ancestors.forEach((id) => merged.add(id));
    return merged;
  }, [userExpanded, ancestors]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY(workspaceSlug),
        JSON.stringify([...userExpanded]),
      );
    } catch {
      /* ignore */
    }
  }, [userExpanded, workspaceSlug]);

  const toggle = (id: string) => {
    if (ancestors.has(id)) return;
    setUserExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const content = (
    <>
      <Box sx={{ px: 1.5, pt: 3.5, pb: 2 }}>
        <WorkspaceSwitcher currentSlug={workspaceSlug} />
        {firstName && (
          <Typography
            sx={{
              mt: 0.5,
              pl: 1,
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "text.secondary",
              opacity: 0.7,
            }}
          >
            {firstName}&apos;s workspace
          </Typography>
        )}
      </Box>

      <Box
        className="lumen-draw-line"
        sx={{
          mx: 1.5,
          height: "1px",
          backgroundColor: "divider",
          mb: 2.5,
          animationDelay: "0.15s",
        }}
      />

      <Box sx={{ pl: 3.5, pr: 1.5, mb: 1.25 }}>
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "text.secondary",
            opacity: 0.65,
          }}
        >
          Pages
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 1.5, py: 0.5 }}>
        {tree.map((node) => (
          <DocTreeItem
            key={node.doc.id}
            node={node}
            depth={0}
            currentId={currentId}
            workspaceSlug={workspaceSlug}
            expanded={expanded}
            onToggle={toggle}
            onCreateChild={(parentId) => {
              setUserExpanded((prev) => new Set(prev).add(parentId));
              onCreate(parentId);
            }}
            onMoveToRoot={(id) => onMove(id, null)}
            onDelete={onDelete}
            onClickAny={onMobileClose}
          />
        ))}

        <Box
          onClick={!creating ? () => onCreate(null) : undefined}
          sx={(theme) => ({
            mt: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            px: 2,
            py: 0.85,
            my: 0.25,
            borderRadius: "4px",
            cursor: creating ? "default" : "pointer",
            color: "text.secondary",
            transition: "background-color 0.15s ease",
            opacity: creating ? 0.45 : 1,
            "&:hover": creating
              ? undefined
              : {
                  backgroundColor: "rgba(42, 37, 32, 0.04)",
                  color: "text.primary",
                },
            ...theme.applyStyles("dark", {
              "&:hover": creating
                ? undefined
                : { backgroundColor: "rgba(235, 230, 217, 0.05)" },
            }),
          })}
        >
          <AddRoundedIcon
            sx={{ fontSize: 14, color: "text.disabled", opacity: 0.75 }}
          />
          <Typography
            noWrap
            sx={{
              fontSize: "0.82rem",
              fontWeight: 500,
              letterSpacing: "-0.005em",
            }}
          >
            New page
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          px: 3.5,
          pt: 2,
          pb: 2.5,
          borderTop: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {user && <UserMenu user={user} />}
      </Box>
    </>
  );

  return (
    <>
      <Box
        sx={(theme) => ({
          width: 264,
          flexShrink: 0,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          backgroundColor: "#EEE8D8",
          height: "100vh",
          position: "relative",
          ...theme.applyStyles("dark", { backgroundColor: "#121006" }),
        })}
      >
        {content}
      </Box>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", md: "none" } }}
        slotProps={{
          paper: {
            sx: (theme) => ({
              width: 264,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#EEE8D8",
              height: "100vh",
              ...theme.applyStyles("dark", { backgroundColor: "#121006" }),
            }),
          },
        }}
      >
        {content}
      </Drawer>
    </>
  );
}
