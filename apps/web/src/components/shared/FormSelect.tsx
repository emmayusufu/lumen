"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import type { SelectProps } from "@mui/material/Select";

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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, width: fullWidth ? "100%" : undefined }}>
      {label && (
        <Box sx={{ display: "flex", gap: 0.5, pl: "2px" }}>
          <Typography fontSize="0.75rem" fontWeight={500} color="text.secondary">
            {label}
          </Typography>
          {required && <Typography fontSize="0.75rem" color="error">*</Typography>}
        </Box>
      )}
      <FormControl fullWidth={fullWidth} error={error} required={required}>
        <Select variant="outlined" error={error} {...rest}>
          {children}
        </Select>
      </FormControl>
      {(errorText || helperText) && (
        <Typography fontSize="0.7rem" color={error ? "error" : "text.disabled"} pl="4px">
          {errorText ?? helperText}
        </Typography>
      )}
    </Box>
  );
}
