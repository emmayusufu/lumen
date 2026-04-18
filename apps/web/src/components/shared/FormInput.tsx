"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import type { TextFieldProps } from "@mui/material/TextField";

type Props = Omit<TextFieldProps, "label" | "variant" | "sx"> & {
  label?: string;
  required?: boolean;
  errorText?: string;
};

export function FormInput({ label, required, type, error, errorText, helperText, slotProps, ...rest }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  const passwordAdornment = isPassword ? {
    endAdornment: (
      <InputAdornment position="end">
        <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small" tabIndex={-1}>
          {showPassword
            ? <VisibilityOffOutlinedIcon sx={{ fontSize: 17 }} />
            : <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />}
        </IconButton>
      </InputAdornment>
    ),
  } : {};

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, width: "100%" }}>
      {label && (
        <Box sx={{ display: "flex", gap: 0.5, pl: "2px" }}>
          <Typography fontSize="0.75rem" fontWeight={500} color="text.secondary">
            {label}
          </Typography>
          {required && <Typography fontSize="0.75rem" color="error">*</Typography>}
        </Box>
      )}
      <TextField
        {...rest}
        type={isPassword ? (showPassword ? "text" : "password") : type}
        variant="outlined"
        fullWidth
        error={!!error}
        sx={(theme) => ({
          "& .MuiOutlinedInput-root": {
            borderRadius: "6px",
            transition: "background-color 0.15s",
            "& .MuiOutlinedInput-notchedOutline": {
              borderWidth: "1px",
              borderColor: "rgba(135, 131, 120, 0.35)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(135, 131, 120, 0.55)",
            },
            "&.Mui-focused": { backgroundColor: "transparent" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderWidth: "1px",
              borderColor: "primary.main",
            },
            "&.Mui-error .MuiOutlinedInput-notchedOutline": {
              borderWidth: "1px",
              borderColor: "error.main",
            },
            ...theme.applyStyles("dark", {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255, 255, 255, 0.15)",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255, 255, 255, 0.28)",
              },
            }),
          },
        })}
        slotProps={{
          ...slotProps,
          input: {
            ...(slotProps as { input?: object })?.input,
            ...passwordAdornment,
          },
          htmlInput: {
            ...(slotProps as { htmlInput?: object })?.htmlInput,
            suppressHydrationWarning: true,
          },
        }}
      />
      {(errorText || helperText) && (
        <Typography fontSize="0.7rem" color={error ? "error" : "text.disabled"} pl="4px">
          {errorText ?? helperText}
        </Typography>
      )}
    </Box>
  );
}
