"use client";

import { extendTheme } from "@mui/material/styles";

export const theme = extendTheme({
  colorSchemeSelector: "class",
  typography: {
    fontFamily: "var(--font-nunito), 'Nunito', sans-serif",
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    h6: { fontWeight: 700, letterSpacing: "-0.01em" },
    subtitle1: { fontWeight: 600 },
    subtitle2: {
      fontWeight: 600,
      fontSize: "0.7rem",
      letterSpacing: "0.06em",
      textTransform: "uppercase" as const,
    },
    body1: { lineHeight: 1.7, fontSize: "0.95rem" },
    body2: { lineHeight: 1.75, fontSize: "0.9rem" },
    button: { fontWeight: 700, textTransform: "none" as const },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, boxShadow: "none" },
        sizeMedium: { height: 42, padding: "0 20px" },
        sizeSmall: { padding: "0 14px" },
        sizeLarge: { padding: "0 24px" },
        containedPrimary: { "&:hover": { boxShadow: "none" } },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { transition: "all 0.15s ease" },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          "& .MuiOutlinedInput-root": {
            height: 42,
            borderRadius: "8px",
            fontSize: "0.875rem",
            backgroundColor: "#FAF8F3",
            transition: "all 0.2s ease",
            "& fieldset": {
              borderWidth: "1.5px",
            },
            "&:hover:not(.Mui-error) fieldset": {
              borderColor: theme.vars.palette.primary.main,
              borderWidth: "1.5px",
            },
            "&.Mui-focused": {
              backgroundColor: theme.vars.palette.background.paper,
            },
            "&.Mui-focused:not(.Mui-error) fieldset": {
              borderColor: theme.vars.palette.primary.main,
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
          ...theme.applyStyles("dark", {
            "& .MuiOutlinedInput-root": {
              backgroundColor: "rgba(255,255,255,0.04)",
            },
          }),
        }),
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: ({ theme }) => ({
          height: 46,
          borderRadius: "6px",
          fontSize: "0.875rem",
          backgroundColor: "#FAF8F3",
          transition: "all 0.2s ease",
          "& .MuiOutlinedInput-notchedOutline": {
            borderWidth: "1.5px",
          },
          "&:hover:not(.Mui-error) .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.vars.palette.primary.main,
            borderWidth: "1.5px",
          },
          "&.Mui-focused": {
            backgroundColor: theme.vars.palette.background.paper,
          },
          "&.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.vars.palette.primary.main,
            borderWidth: "2px",
          },
          "& .MuiSelect-select": {
            padding: "0 14px",
            display: "flex",
            alignItems: "center",
          },
          ...theme.applyStyles("dark", {
            backgroundColor: "rgba(255,255,255,0.04)",
          }),
        }),
      },
    },
  },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#8B9B6E", light: "#D5DDBF", dark: "#5E6B47" },
        secondary: { main: "#B8804A" },
        background: { default: "#EEE8D8", paper: "#FAF8F3" },
        text: { primary: "#2A2520", secondary: "#6B6358" },
        divider: "#E6DFD0",
      },
    },
    dark: {
      palette: {
        primary: { main: "#BAC8A0", light: "#384230", dark: "#A3B087" },
        secondary: { main: "#D4A574" },
        background: { default: "#121006", paper: "#1D1B15" },
        text: { primary: "#EBE6D9", secondary: "#9E998C" },
        divider: "#2A2821",
      },
    },
  },
});
