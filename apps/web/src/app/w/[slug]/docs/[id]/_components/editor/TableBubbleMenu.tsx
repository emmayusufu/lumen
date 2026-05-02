"use client";

import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";

const ITEMS = [
  {
    label: "Add column",
    Icon: AddRoundedIcon,
    suffix: "col",
    fn: (e: Editor) => e.chain().focus().addColumnAfter().run(),
  },
  {
    label: "Add row",
    Icon: AddRoundedIcon,
    suffix: "row",
    fn: (e: Editor) => e.chain().focus().addRowAfter().run(),
  },
  {
    label: "Delete column",
    Icon: RemoveRoundedIcon,
    suffix: "col",
    fn: (e: Editor) => e.chain().focus().deleteColumn().run(),
  },
  {
    label: "Delete row",
    Icon: RemoveRoundedIcon,
    suffix: "row",
    fn: (e: Editor) => e.chain().focus().deleteRow().run(),
  },
  {
    label: "Delete table",
    Icon: DeleteOutlineRoundedIcon,
    suffix: "",
    fn: (e: Editor) => e.chain().focus().deleteTable().run(),
    danger: true,
  },
];

export function TableBubbleMenu({ editor }: { editor: Editor }) {
  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: e }) => e.isActive("table")}
    >
      <Paper
        elevation={0}
        sx={(theme) => ({
          display: "flex",
          p: 0.5,
          gap: 0.25,
          borderRadius: "9px",
          border: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(16px)",
          bgcolor: "rgba(255,255,255,0.92)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
          ...theme.applyStyles("dark", {
            backgroundColor: "rgba(28,28,28,0.88)",
          }),
        })}
      >
        {ITEMS.map(({ label, Icon, suffix, fn, danger }) => (
          <Tooltip key={label} title={label} arrow>
            <IconButton
              size="small"
              onClick={() => fn(editor)}
              sx={{
                p: 0.625,
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                gap: 0.25,
                color: danger ? "error.main" : "text.secondary",
                "&:hover": {
                  bgcolor: "action.hover",
                  color: danger ? "error.main" : "text.primary",
                },
              }}
            >
              <Icon sx={{ fontSize: 14 }} />
              {suffix && (
                <Typography
                  sx={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  {suffix}
                </Typography>
              )}
            </IconButton>
          </Tooltip>
        ))}
      </Paper>
    </BubbleMenu>
  );
}
