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
        <Select
          variant="outlined"
          error={error}
          MenuProps={{
            PaperProps: {
              sx: (theme) => ({
                boxShadow: "none",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "8px",
                py: 0.5,
                backgroundColor: "#EEE8D8",
                ...theme.applyStyles("dark", { backgroundColor: "#121006" }),
                "& .MuiMenuItem-root": {
                  borderRadius: "6px",
                  mx: "4px",
                  width: "calc(100% - 8px)",
                },
              }),
            },
          }}
          sx={(theme) => ({
            backgroundColor: "#ffffff",
            height: "42px",
            borderRadius: "8px",
            "& .MuiOutlinedInput-notchedOutline": { borderRadius: "8px", borderColor: "rgba(135, 131, 120, 0.35)" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(135, 131, 120, 0.55)" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderWidth: "1px", borderColor: "primary.main" },
            ...theme.applyStyles("dark", {
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255, 255, 255, 0.15)" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255, 255, 255, 0.28)" },
            }),
          })}
          {...rest}
        >
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
