"use client";

import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import { FORMATS } from "./blockMenu";

interface Props {
  editor: Editor;
  onAskAI: () => void;
  onComment?: () => void;
}

export function TextBubbleMenu({ editor, onAskAI, onComment }: Props) {
  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: e, state }) =>
        !state.selection.empty && !e.isActive("table")
      }
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
          boxShadow:
            "0 4px 24px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.8) inset",
          ...theme.applyStyles("dark", {
            backgroundColor: "rgba(28,28,28,0.88)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset",
          }),
        })}
      >
        <IconButton
          size="small"
          onClick={onAskAI}
          sx={(theme) => ({
            p: 0.625,
            borderRadius: "6px",
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            gap: 0.25,
            "&:hover": { bgcolor: "rgba(139,155,110,0.14)" },
            ...theme.applyStyles("dark", {
              "&:hover": { backgroundColor: "rgba(186,200,160,0.14)" },
            }),
          })}
        >
          <AutoAwesomeRoundedIcon sx={{ fontSize: 13 }} />
          <Typography
            sx={{
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            AI
          </Typography>
        </IconButton>
        <Divider />
        {FORMATS.map(({ Icon, mark, fn }) => (
          <IconButton
            key={mark}
            size="small"
            onClick={() => fn(editor)}
            sx={(theme) => ({
              p: 0.625,
              borderRadius: "6px",
              color: editor.isActive(mark) ? "primary.main" : "text.secondary",
              bgcolor: editor.isActive(mark)
                ? "rgba(163,176,135,0.12)"
                : "transparent",
              "&:hover": { bgcolor: "action.hover" },
              transition: "all 0.1s ease",
              ...theme.applyStyles("dark", {
                backgroundColor: editor.isActive(mark)
                  ? "rgba(186,200,160,0.15)"
                  : "transparent",
              }),
            })}
          >
            <Icon sx={{ fontSize: 14 }} />
          </IconButton>
        ))}
        {onComment && (
          <>
            <Divider />
            <IconButton
              size="small"
              onClick={onComment}
              sx={{
                p: 0.625,
                borderRadius: "6px",
                color: "text.secondary",
                "&:hover": { bgcolor: "action.hover", color: "text.primary" },
              }}
            >
              <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </>
        )}
      </Paper>
    </BubbleMenu>
  );
}

function Divider() {
  return (
    <Box
      sx={{
        width: "1px",
        height: 16,
        mx: 0.375,
        backgroundColor: "divider",
        alignSelf: "center",
      }}
    />
  );
}
