"use client";

import { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import ButtonBase from "@mui/material/ButtonBase";
import NorthRoundedIcon from "@mui/icons-material/NorthRounded";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !focused && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focused]);

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <Box>
      <Box
        sx={(theme) => ({
          maxWidth: 700,
          mx: "auto",
          borderRadius: "12px",
          backgroundColor: "#FAF8F3",
          border: "1.5px solid",
          borderColor: focused ? "primary.main" : "divider",
          boxShadow: focused
            ? "0 0 0 3px rgba(139, 155, 110, 0.12), 0 4px 16px rgba(0,0,0,0.04)"
            : "0 1px 3px rgba(0,0,0,0.03)",
          transition: "all 0.22s cubic-bezier(0.2, 0.7, 0.3, 1)",
          overflow: "hidden",
          ...theme.applyStyles("dark", {
            backgroundColor: "rgba(255,255,255,0.04)",
            boxShadow: focused
              ? "0 0 0 3px rgba(186, 200, 160, 0.16), 0 4px 16px rgba(0,0,0,0.4)"
              : "0 1px 3px rgba(0,0,0,0.2)",
          }),
        })}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: 1,
            p: 1.5,
            pl: 2.5,
          }}
        >
          <InputBase
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={6}
            placeholder="Ask anything..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            sx={{
              fontSize: "0.93rem",
              py: 0.5,
              "& .MuiInputBase-input::placeholder": {
                color: "text.secondary",
                opacity: 0.5,
              },
            }}
          />
          <ButtonBase
            onClick={handleSubmit}
            disabled={!canSend}
            sx={{
              minWidth: canSend ? 72 : 38,
              height: 38,
              borderRadius: "14px",
              bgcolor: canSend ? "primary.main" : "action.hover",
              color: canSend ? "white" : "text.disabled",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              px: canSend ? 2 : 0,
              fontFamily: "inherit",
              fontSize: "0.8rem",
              fontWeight: 700,
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                bgcolor: canSend ? "primary.dark" : "action.hover",
                transform: canSend ? "translateY(-1px)" : "none",
              },
              "&:active": {
                transform: canSend ? "translateY(0) scale(0.97)" : "none",
              },
            }}
          >
            <NorthRoundedIcon sx={{ fontSize: 16 }} />
            {canSend && (
              <Box component="span" sx={{ lineHeight: 1, letterSpacing: "0.02em" }}>
                Send
              </Box>
            )}
          </ButtonBase>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2.5,
            pb: 1,
            pt: 0,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ opacity: 0.4, fontSize: "0.68rem", userSelect: "none" }}
          >
            Press / to focus
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ opacity: 0.4, fontSize: "0.68rem", userSelect: "none" }}
          >
            Enter to send, Shift+Enter for new line
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
