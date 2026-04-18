"use client";

import Box from "@mui/material/Box";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <SettingsSidebar />
      <Box
        sx={(theme) => ({
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          pt: { xs: 0.75, md: 1 },
          pr: { xs: 0.75, md: 1 },
          pb: { xs: 0.75, md: 1 },
          pl: { xs: 1.5, md: 2.5 },
          backgroundColor: "#EEE8D8",
          ...theme.applyStyles("dark", {
            backgroundColor: "#121006",
          }),
        })}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            backgroundColor: "background.paper",
            borderRadius: "14px",
            border: "1px solid",
            borderColor: "divider",
            px: { xs: 3, md: 6 },
            py: { xs: 5, md: 8 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
