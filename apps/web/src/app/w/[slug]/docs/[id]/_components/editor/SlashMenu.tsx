"use client";

import { FloatingMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { BlockGroup } from "./blockMenu";

interface Props {
  editor: Editor;
  blockGroups: BlockGroup[];
}

export function SlashMenu({ editor, blockGroups }: Props) {
  return (
    <FloatingMenu
      editor={editor}
      shouldShow={({ state }) => {
        const { $anchor, empty } = state.selection;
        if (!empty) return false;
        const isTextblock =
          $anchor.parent.isTextblock && !$anchor.parent.type.spec.code;
        return isTextblock && $anchor.parent.textContent === "/";
      }}
    >
      <Paper
        elevation={0}
        sx={(theme) => ({
          py: 1,
          minWidth: 230,
          borderRadius: "10px",
          border: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(16px)",
          bgcolor: "rgba(255,255,255,0.96)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          ...theme.applyStyles("dark", {
            backgroundColor: "rgba(28,28,28,0.92)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }),
        })}
      >
        {blockGroups.map((group, gi) => (
          <Box key={group.label}>
            {gi > 0 && <Divider sx={{ my: 0.75, mx: 1.5 }} />}
            <Typography
              sx={{
                px: 2,
                pb: 0.375,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "text.disabled",
              }}
            >
              {group.label}
            </Typography>
            {group.items.map(({ label, hint, Icon, cmd }) => (
              <Box
                key={label}
                onClick={() => cmd(editor)}
                sx={{
                  px: 2,
                  py: 0.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  cursor: "pointer",
                  transition: "background 0.08s",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 16,
                    flexShrink: 0,
                  }}
                >
                  <Icon sx={{ fontSize: 14, color: "text.secondary" }} />
                </Box>
                <Typography
                  sx={{ fontSize: "0.825rem", fontWeight: 500, flex: 1 }}
                >
                  {label}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "text.disabled", fontSize: "0.7rem" }}
                >
                  {hint}
                </Typography>
              </Box>
            ))}
          </Box>
        ))}
      </Paper>
    </FloatingMenu>
  );
}
