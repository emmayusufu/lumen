"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";

interface Props {
  placeholder: string;
  disabled?: boolean;
  onSubmit: (value: string) => void;
}

export function PromptInput({ placeholder, disabled, onSubmit }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
  };

  const canSend = Boolean(value.trim()) && !disabled;

  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        px: 1.25,
        py: 0.75,
        borderTop: "1px solid",
        borderColor: "divider",
        backgroundColor: "rgba(139, 155, 110, 0.05)",
        ...theme.applyStyles("dark", {
          backgroundColor: "rgba(186, 200, 160, 0.05)",
        }),
      })}
    >
      <InputBase
        autoFocus
        fullWidth
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        sx={{
          fontSize: "0.82rem",
          "& input": { p: 0 },
          "& input::placeholder": { color: "text.disabled", opacity: 1 },
        }}
      />
      <IconButton
        size="small"
        onClick={handleSubmit}
        disabled={!canSend}
        sx={(theme) => ({
          width: 24,
          height: 24,
          borderRadius: "5px",
          backgroundColor: canSend ? "primary.main" : "transparent",
          color: canSend ? "#fff" : "text.disabled",
          "&:hover": {
            backgroundColor: canSend ? "primary.dark" : "transparent",
          },
          "&.Mui-disabled": { color: "text.disabled" },
          ...theme.applyStyles("dark", {
            color: canSend ? "#121006" : "text.disabled",
          }),
        })}
      >
        <ArrowUpwardRoundedIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  );
}
