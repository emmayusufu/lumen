"use client";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface AgentStepProps {
  name: string;
  status: "pending" | "active" | "done";
  message?: string;
}

const AGENT_COLORS: Record<
  string,
  "primary" | "secondary" | "success" | "warning" | "info"
> = {
  supervisor: "primary",
  planner: "info",
  researcher: "secondary",
  coder: "warning",
  writer: "success",
};

export function AgentStep({ name, status, message }: AgentStepProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
      {status === "active" && <CircularProgress size={16} />}
      {status === "done" && (
        <CheckCircleIcon fontSize="small" color="success" />
      )}
      <Chip
        label={name}
        size="small"
        color={AGENT_COLORS[name] ?? "default"}
        variant={status === "active" ? "filled" : "outlined"}
      />
      {message && (
        <Typography variant="caption" color="text.secondary" noWrap>
          {message}
        </Typography>
      )}
    </Box>
  );
}
