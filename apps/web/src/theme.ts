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
    primary: { main: "#A3B087", light: "#D5DDBF", dark: "#78895B" },
    secondary: { main: "#C09060" },
    background: { default: "#F5F6F1", paper: "#ffffff" },
    text: { primary: "#1C1F17", secondary: "#626855" },
    divider: "#DDE0D6",
  },
});

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: "dark",
    primary: { main: "#BAC8A0", light: "#384230", dark: "#A3B087" },
    secondary: { main: "#D4A574" },
    background: { default: "#191919", paper: "#212121" },
    text: { primary: "#E8EBE0", secondary: "#9EA891" },
    divider: "#2d2d2d",
  },
});
