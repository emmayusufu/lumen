"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import type { SelectProps } from "@mui/material/Select";
import { menuPaperSx } from "./menuPaperSx";

type Props = Omit<SelectProps, "label" | "variant" | "sx"> & {
  label?: string;
  required?: boolean;
  errorText?: string;
  helperText?: string;
};

export function FormSelect({
  label,
  required,
  error,
  errorText,
  helperText,
  children,
  fullWidth = true,
  ...rest
}: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        width: fullWidth ? "100%" : undefined,
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
            <Typography sx={{ fontSize: "0.75rem", color: "error" }}>
              *
            </Typography>
          )}
        </Box>
      )}
      <FormControl fullWidth={fullWidth} error={error} required={required}>
        <Select
          variant="outlined"
          error={error}
          MenuProps={{ slotProps: { paper: { sx: menuPaperSx } } }}
          sx={(theme) => ({
            backgroundColor: "#FDFCF7",
            height: "42px",
            borderRadius: "8px",
            "& .MuiOutlinedInput-notchedOutline": {
              borderRadius: "8px",
              borderColor: "rgba(135, 131, 120, 0.35)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(135, 131, 120, 0.55)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderWidth: "1px",
              borderColor: "primary.main",
            },
            ...theme.applyStyles("dark", {
              backgroundColor: "rgba(255, 255, 255, 0.10)",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255, 255, 255, 0.15)",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(255, 255, 255, 0.28)",
              },
            }),
          })}
          {...rest}
        >
          {children}
        </Select>
      </FormControl>
      {(errorText || helperText) && (
        <Typography
          sx={{
            fontSize: "0.7rem",
            color: error ? "error" : "text.disabled",
            pl: "4px",
          }}
        >
          {errorText ?? helperText}
        </Typography>
      )}
    </Box>
  );
}
