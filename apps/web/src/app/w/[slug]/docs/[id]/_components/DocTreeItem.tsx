"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import ListItemIcon from "@mui/material/ListItemIcon";
import { menuPaperSx } from "@repo/ui";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import NorthWestRoundedIcon from "@mui/icons-material/NorthWestRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import type { DocNode } from "./buildDocTree";

interface Props {
  node: DocNode;
  depth: number;
  currentId: string;
  workspaceSlug: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onCreateChild: (parentId: string) => void;
  onMoveToRoot: (id: string) => void;
  onDelete: (id: string) => void;
  onClickAny?: () => void;
}

export function DocTreeItem({
  node,
  depth,
  currentId,
  workspaceSlug,
  expanded,
  onToggle,
  onCreateChild,
  onMoveToRoot,
  onDelete,
  onClickAny,
}: Props) {
  const router = useRouter();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const { doc, children } = node;
  const hasChildren = children.length > 0;
  const isOpen = expanded.has(doc.id);
  const active = doc.id === currentId;
  const isShared = doc.role !== "owner";
  const canManage = doc.role === "owner";

  const navigate = () => {
    router.push(`/w/${workspaceSlug}/docs/${doc.id}`);
    onClickAny?.();
  };

  const stop = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <>
      <Box
        onClick={navigate}
        sx={(theme) => ({
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          pl: 1 + depth * 1.25,
          pr: 1,
          py: 0.6,
          my: 0.1,
          borderRadius: "4px",
          cursor: "pointer",
          transition: "background-color 0.15s ease",
          backgroundColor: active ? "rgba(139, 155, 110, 0.14)" : "transparent",
          "&:hover": {
            backgroundColor: active
              ? "rgba(139, 155, 110, 0.18)"
              : "rgba(42, 37, 32, 0.04)",
            "& .doc-row-actions": { opacity: 1 },
          },
          ...theme.applyStyles("dark", {
            backgroundColor: active
              ? "rgba(186, 200, 160, 0.13)"
              : "transparent",
            "&:hover": {
              backgroundColor: active
                ? "rgba(186, 200, 160, 0.18)"
                : "rgba(235, 230, 217, 0.05)",
              "& .doc-row-actions": { opacity: 1 },
            },
          }),
        })}
      >
        <Box
          onClick={(e) => {
            stop(e);
            if (hasChildren) onToggle(doc.id);
          }}
          sx={{
            width: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            cursor: hasChildren ? "pointer" : "default",
            color: "text.disabled",
            opacity: hasChildren ? 0.85 : 0,
            "&:hover": hasChildren ? { color: "text.secondary" } : undefined,
          }}
        >
          {isOpen ? (
            <KeyboardArrowDownRoundedIcon sx={{ fontSize: 14 }} />
          ) : (
            <ChevronRightRoundedIcon sx={{ fontSize: 14 }} />
          )}
        </Box>

        {isShared ? (
          <PeopleOutlineRoundedIcon
            sx={{
              fontSize: 12,
              color: "text.disabled",
              flexShrink: 0,
              opacity: 0.7,
            }}
          />
        ) : (
          <DescriptionOutlinedIcon
            sx={{
              fontSize: 13,
              color: "text.disabled",
              flexShrink: 0,
              opacity: 0.65,
            }}
          />
        )}

        <Typography
          noWrap
          sx={{
            flex: 1,
            fontSize: "0.82rem",
            fontWeight: active ? 600 : 500,
            letterSpacing: "-0.005em",
            color: active ? "text.primary" : "text.secondary",
            lineHeight: 1.3,
          }}
        >
          {doc.title || "Untitled"}
        </Typography>

        <Box
          className="doc-row-actions"
          sx={{
            display: "flex",
            gap: 0,
            opacity: 0,
            transition: "opacity 0.12s",
          }}
        >
          {canManage && (
            <IconButton
              size="small"
              onClick={(e) => {
                stop(e);
                setMenuAnchor(e.currentTarget);
              }}
              sx={{
                p: 0.25,
                color: "text.disabled",
                "&:hover": { color: "text.secondary" },
              }}
            >
              <MoreHorizRoundedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          )}
          {canManage && (
            <IconButton
              size="small"
              onClick={(e) => {
                stop(e);
                onCreateChild(doc.id);
              }}
              sx={{
                p: 0.25,
                color: "text.disabled",
                "&:hover": { color: "text.secondary" },
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {isOpen &&
        children.map((child) => (
          <DocTreeItem
            key={child.doc.id}
            node={child}
            depth={depth + 1}
            currentId={currentId}
            workspaceSlug={workspaceSlug}
            expanded={expanded}
            onToggle={onToggle}
            onCreateChild={onCreateChild}
            onMoveToRoot={onMoveToRoot}
            onDelete={onDelete}
            onClickAny={onClickAny}
          />
        ))}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: menuPaperSx } }}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onCreateChild(doc.id);
          }}
        >
          <ListItemIcon>
            <AddRoundedIcon sx={{ fontSize: 17, color: "primary.main" }} />
          </ListItemIcon>
          New subpage
        </MenuItem>
        {doc.parent_id && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onMoveToRoot(doc.id);
            }}
          >
            <ListItemIcon>
              <NorthWestRoundedIcon
                sx={{ fontSize: 17, color: "text.secondary" }}
              />
            </ListItemIcon>
            Move to top level
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onDelete(doc.id);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteOutlineRoundedIcon
              sx={{ fontSize: 17, color: "error.main" }}
            />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </>
  );
}
