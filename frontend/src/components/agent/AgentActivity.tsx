"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import { AgentStep } from "./AgentStep";

interface AgentState {
  name: string;
  status: "pending" | "active" | "done";
  message?: string;
}

interface AgentActivityProps {
  agents: AgentState[];
  visible: boolean;
}

export function AgentActivity({ agents, visible }: AgentActivityProps) {
  return (
    <Collapse in={visible}>
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Agent Activity
        </Typography>
        <Box>
          {agents.map((agent) => (
            <AgentStep
              key={agent.name}
              name={agent.name}
              status={agent.status}
              message={agent.message}
            />
          ))}
        </Box>
      </Paper>
    </Collapse>
  );
}
