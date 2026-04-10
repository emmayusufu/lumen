"use client";

import { createTheme } from "@mui/material/styles";

const shared = {
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
        root: { borderRadius: 10, padding: "8px 20px" },
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
  },
};

export const lightTheme = createTheme({
  ...shared,
  palette: {
    mode: "light",
    primary: { main: "#1e3a8a", light: "#dbeafe", dark: "#1e40af" },
    secondary: { main: "#6366f1" },
    background: { default: "#f8fafb", paper: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#64748b" },
    divider: "#e2e8f0",
  },
});

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: "dark",
    primary: { main: "#60a5fa", light: "#1e3a8a", dark: "#3b82f6" },
    secondary: { main: "#818cf8" },
    background: { default: "#191919", paper: "#212121" },
    text: { primary: "#e2e8f0", secondary: "#9e9e9e" },
    divider: "#2d2d2d",
  },
});
