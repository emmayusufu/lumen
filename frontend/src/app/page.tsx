"use client";

import { useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ReportView } from "@/components/report/ReportView";
import { AgentActivity } from "@/components/agent/AgentActivity";
import { useChat } from "@/hooks/useChat";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { AgentUpdate } from "@/lib/types";

const AGENT_NAMES = ["supervisor", "planner", "researcher", "coder", "writer"];

type AgentStatus = "pending" | "active" | "done";

interface AgentState {
  name: string;
  status: AgentStatus;
  message?: string;
}

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const {
    messages,
    isLoading,
    outputMode,
    setOutputMode,
    lastOutput,
    sources,
    sendMessage,
    handleAgentUpdate,
  } = useChat();

  const [agentStates, setAgentStates] = useState<AgentState[]>(
    AGENT_NAMES.map((name) => ({ name, status: "pending" })),
  );

  const onAgentMessage = useCallback(
    (update: AgentUpdate) => {
      handleAgentUpdate(update);

      if (update.type === "agent_update" && update.agent) {
        setAgentStates((prev) =>
          prev.map((a) => {
            if (a.name === update.agent) {
              return { ...a, status: "active" as const, message: "Working..." };
            }
            if (a.status === "active" && a.name !== update.agent) {
              return { ...a, status: "done" as const };
            }
            return a;
          }),
        );
      }

      if (update.type === "done") {
        setAgentStates((prev) =>
          prev.map((a) => ({ ...a, status: "done" as const })),
        );
      }
    },
    [handleAgentUpdate],
  );

  useWebSocket(onAgentMessage);

  const handleSend = async (content: string) => {
    setShowReport(false);
    setAgentStates(
      AGENT_NAMES.map((name) => ({ name, status: "pending" as AgentStatus })),
    );
    await sendMessage(content);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar
        open={sidebarOpen}
        outputMode={outputMode}
        onModeChange={setOutputMode}
        onClose={() => setSidebarOpen(false)}
      />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Toolbar />
        <AgentActivity agents={agentStates} visible={isLoading} />
        {showReport && lastOutput ? (
          <ReportView
            content={lastOutput}
            sources={sources}
            onSwitchToChat={() => setShowReport(false)}
          />
        ) : (
          <>
            <MessageList messages={messages} />
            {lastOutput && !isLoading && outputMode === "chat" && (
              <Box sx={{ display: "flex", justifyContent: "center", pb: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setShowReport(true)}
                >
                  View as Report
                </Button>
              </Box>
            )}
          </>
        )}
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </Box>
    </Box>
  );
}
