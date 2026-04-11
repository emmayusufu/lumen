"use client";

import { createContext, useContext } from "react";
import { CssVarsProvider, useColorScheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { theme } from "@/theme";

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

function ThemeContextBridge({ children }: { children: React.ReactNode }) {
  const { mode, setMode } = useColorScheme();
  const isDark = mode === "dark";
  const toggleTheme = () => setMode(isDark ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <CssVarsProvider theme={theme} defaultMode="light">
        <CssBaseline />
        <ThemeContextBridge>
          {children}
        </ThemeContextBridge>
      </CssVarsProvider>
    </AppRouterCacheProvider>
  );
}
