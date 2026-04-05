"use client";

import { useState, useCallback } from "react";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChat } from "@/hooks/useChat";
import { useSessions } from "@/hooks/useSessions";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { sessions, refresh, removeSession } = useSessions();
  const { messages, isLoading, activeAgent, sendMessage, clearMessages, loadSession } = useChat(refresh);

  const handleSelectSession = useCallback(
    async (id: string) => {
      await loadSession(id);
      setSidebarOpen(false);
    },
    [loadSession],
  );

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <Header
        onClear={clearMessages}
        onHistoryToggle={() => setSidebarOpen(true)}
        activeAgent={activeAgent}
        isLoading={isLoading}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        onSelectSession={handleSelectSession}
        onDeleteSession={removeSession}
      />
      {isLoading && (
        <LinearProgress
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            zIndex: 1300,
            bgcolor: "transparent",
            "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
          }}
        />
      )}
      <Box sx={{ height: 56 }} />
      <MessageList messages={messages} />
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </Box>
  );
}
