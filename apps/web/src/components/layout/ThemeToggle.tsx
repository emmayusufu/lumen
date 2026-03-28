"use client";

import IconButton from "@mui/material/IconButton";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useThemeContext } from "@/app/providers";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeContext();

  return (
    <IconButton color="inherit" onClick={toggleTheme}>
      {isDark ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
}
