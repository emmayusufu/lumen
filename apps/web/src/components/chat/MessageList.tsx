"use client";

import { useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import type { ChatMessage } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
          px: 3,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 3,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(45, 212, 191, 0.08)"
                : "rgba(13, 148, 136, 0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TravelExploreIcon sx={{ fontSize: 32, color: "primary.main", opacity: 0.7 }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflow: "auto",
        py: 3,
        px: { xs: 2, md: 0 },
      }}
    >
      <Box sx={{ maxWidth: 720, mx: "auto" }}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </Box>
    </Box>
  );
}
