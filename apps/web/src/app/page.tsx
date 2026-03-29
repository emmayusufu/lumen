"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ReportView } from "@/components/report/ReportView";
import { useChat } from "@/hooks/useChat";

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
  } = useChat();

  const handleSend = async (content: string) => {
    setShowReport(false);
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
        {isLoading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Researching...
            </Typography>
          </Box>
        )}
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
