"use client";

import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import type { OutputMode } from "@/lib/types";

const DRAWER_WIDTH = 280;

interface SidebarProps {
  open: boolean;
  outputMode: OutputMode;
  onModeChange: (mode: OutputMode) => void;
  onClose: () => void;
}

export function Sidebar({ open, outputMode, onModeChange, onClose }: SidebarProps) {
  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      sx={{ width: DRAWER_WIDTH, "& .MuiDrawer-paper": { width: DRAWER_WIDTH } }}
    >
      <Toolbar />
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Output Mode
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={outputMode === "report"}
              onChange={(e) => onModeChange(e.target.checked ? "report" : "chat")}
            />
          }
          label={outputMode === "report" ? "Report" : "Chat"}
        />
      </Box>
      <Divider />
      <List>
        <ListItemButton>
          <ListItemText primary="New Research" />
        </ListItemButton>
      </List>
    </Drawer>
  );
}
