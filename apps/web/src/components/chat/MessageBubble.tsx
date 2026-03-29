"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Link from "@mui/material/Link";
import PersonIcon from "@mui/icons-material/Person";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/lib/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        mb: 2,
        flexDirection: isUser ? "row-reverse" : "row",
      }}
    >
      <Avatar
        sx={{
          bgcolor: isUser ? "primary.main" : "secondary.main",
          width: 32,
          height: 32,
        }}
      >
        {isUser ? (
          <PersonIcon fontSize="small" />
        ) : (
          <SmartToyIcon fontSize="small" />
        )}
      </Avatar>
      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: "75%",
          bgcolor: isUser ? "primary.light" : "background.paper",
          "& pre": {
            bgcolor: "grey.900",
            color: "grey.100",
            p: 1.5,
            borderRadius: 1,
            overflow: "auto",
            fontSize: "0.85rem",
          },
          "& code": {
            fontSize: "0.85rem",
          },
          "& p:first-of-type": { mt: 0 },
          "& p:last-of-type": { mb: 0 },
          "& ul, & ol": { pl: 2.5 },
          "& h3": { mt: 1.5, mb: 0.5, fontSize: "1rem" },
          "& h4": { mt: 1, mb: 0.5, fontSize: "0.95rem" },
        }}
      >
        {isUser ? (
          <Typography variant="body2">{message.content}</Typography>
        ) : (
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <Link href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </Link>
              ),
              p: ({ children }) => (
                <Typography variant="body2" sx={{ my: 0.5 }}>
                  {children}
                </Typography>
              ),
            }}
          >
            {message.content}
          </Markdown>
        )}
      </Paper>
    </Box>
  );
}
