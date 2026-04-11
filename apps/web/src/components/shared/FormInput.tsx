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

type Props = Omit<TextFieldProps, "label" | "variant"> & {
  label?: string;
  required?: boolean;
  errorText?: string;
};

export function FormInput({ label, required, type, error, errorText, helperText, slotProps, sx, ...rest }: Props) {
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
        slotProps={{
          ...slotProps,
          input: {
            ...(slotProps as { input?: object })?.input,
            ...passwordAdornment,
          },
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            height: 43,
            borderRadius: "10px",
            fontSize: "0.875rem",
            bgcolor: (t) => t.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "#fafafa",
            transition: "all 0.2s ease",
            "& fieldset": {
              borderColor: error ? "error.main" : "divider",
              borderWidth: "1.5px",
            },
            "&:hover fieldset": {
              borderColor: error ? "error.main" : "primary.main",
              borderWidth: "1.5px",
            },
            "&.Mui-focused": {
              bgcolor: "background.paper",
            },
            "&.Mui-focused fieldset": {
              borderColor: error ? "error.main" : "primary.main",
              borderWidth: "2px",
            },
          },
          "& .MuiInputBase-input": {
            padding: "0 14px",
            fontSize: "0.875rem",
            "&::placeholder": {
              opacity: 1,
            },
          },
          ...sx,
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
