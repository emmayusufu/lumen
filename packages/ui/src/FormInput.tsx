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

function friendlyMessage(
  input: HTMLInputElement | HTMLTextAreaElement,
): string {
  const v = input.validity;
  if (v.valueMissing) return "This field is required.";
  if (v.typeMismatch && input.type === "email")
    return "Enter a valid email address.";
  if (v.typeMismatch && input.type === "url") return "Enter a valid URL.";
  if (v.tooShort)
    return `Must be at least ${input.getAttribute("minlength")} characters.`;
  if (v.tooLong)
    return `Must be at most ${input.getAttribute("maxlength")} characters.`;
  if (v.patternMismatch) return "Doesn't match the expected format.";
  return input.validationMessage || "Invalid value.";
}

export function FormInput({
  label,
  required,
  type,
  error,
  errorText,
  helperText,
  slotProps,
  onChange,
  ...rest
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [validityMsg, setValidityMsg] = useState("");
  const isPassword = type === "password";

  const passwordAdornment = isPassword
    ? {
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShowPassword((v) => !v)}
              edge="end"
              size="small"
              tabIndex={-1}
            >
              {showPassword ? (
                <VisibilityOffOutlinedIcon sx={{ fontSize: 17 }} />
              ) : (
                <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
              )}
            </IconButton>
          </InputAdornment>
        ),
      }
    : {};

  const handleInvalid = (
    e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    e.preventDefault();
    setValidityMsg(friendlyMessage(e.currentTarget));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (validityMsg && e.currentTarget.validity.valid) setValidityMsg("");
    onChange?.(e as React.ChangeEvent<HTMLInputElement>);
  };

  const message = errorText ?? validityMsg ?? helperText;
  const showAsError = Boolean(errorText || validityMsg || error);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        width: "100%",
      }}
    >
      {label && (
        <Box sx={{ display: "flex", gap: 0.5, pl: "2px" }}>
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 500,
              color: "text.secondary",
            }}
          >
            {label}
          </Typography>
          {required && (
            <Typography sx={{ fontSize: "0.75rem", color: "error.main" }}>
              *
            </Typography>
          )}
        </Box>
      )}
      <TextField
        {...rest}
        onChange={handleChange}
        required={required}
        type={isPassword ? (showPassword ? "text" : "password") : type}
        variant="outlined"
        fullWidth
        error={showAsError}
        sx={(theme) => ({
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#FDFCF7",
            "& .MuiOutlinedInput-notchedOutline": {
              borderWidth: "1px",
              borderColor: "rgba(135, 131, 120, 0.35)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(135, 131, 120, 0.55)",
            },
            "&.Mui-focused": { backgroundColor: "#FDFCF7" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderWidth: "1px",
              borderColor: "primary.main",
            },
            "&.Mui-error .MuiOutlinedInput-notchedOutline": {
              borderWidth: "1px",
              borderColor: "error.main",
            },
            "&:has(input:user-invalid) .MuiOutlinedInput-notchedOutline, &:has(textarea:user-invalid) .MuiOutlinedInput-notchedOutline":
              {
                borderColor: "error.main",
              },
            ...theme.applyStyles("dark", {
              backgroundColor: "rgba(255, 255, 255, 0.10)",
              "&.Mui-focused": { backgroundColor: "rgba(255, 255, 255, 0.10)" },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255, 255, 255, 0.15)",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255, 255, 255, 0.28)",
              },
            }),
          },
          "& input::placeholder, & textarea::placeholder": {
            color: "text.disabled",
            opacity: 0.55,
          },
          "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active":
            {
              WebkitBoxShadow: "0 0 0 1000px #FDFCF7 inset",
              WebkitTextFillColor: "#2A2520",
              caretColor: "#2A2520",
              transition:
                "background-color 9999s ease-out 0s, color 9999s ease-out 0s",
            },
          ...theme.applyStyles("dark", {
            "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active":
              {
                WebkitBoxShadow: "0 0 0 1000px #2A2520 inset",
                WebkitTextFillColor: "#EBE6D9",
                caretColor: "#EBE6D9",
              },
          }),
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
            onInvalid: handleInvalid,
          },
        }}
      />
      {message && (
        <Typography
          sx={{
            fontSize: "0.7rem",
            color: showAsError ? "error.main" : "text.disabled",
            pl: "4px",
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}
