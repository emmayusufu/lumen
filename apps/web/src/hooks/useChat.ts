"use client";

import { useState, useCallback } from "react";
import type {
  ChatMessage,
  OutputMode,
  ResearchResult,
  AgentUpdate,
} from "@/lib/types";
import { postResearch } from "@/lib/api";

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  outputMode: OutputMode;
  setOutputMode: (mode: OutputMode) => void;
  lastOutput: string;
  sources: ResearchResult[];
  sendMessage: (content: string) => Promise<void>;
  handleAgentUpdate: (update: AgentUpdate) => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [outputMode, setOutputMode] = useState<OutputMode>("chat");
  const [lastOutput, setLastOutput] = useState("");
  const [sources, setSources] = useState<ResearchResult[]>([]);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const result = await postResearch(content, outputMode);

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.output || "No results found.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setLastOutput(result.output || "");
        setSources(result.research_results || []);
      } catch (error) {
        const errorMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Something went wrong"}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [outputMode],
  );

  const handleAgentUpdate = useCallback((update: AgentUpdate) => {
    if (update.type === "done") {
      setIsLoading(false);
    }
    if (update.data?.output) {
      setLastOutput(update.data.output);
    }
    if (update.data?.research_results) {
      setSources(update.data.research_results);
    }
  }, []);

  return {
    messages,
    isLoading,
    outputMode,
    setOutputMode,
    lastOutput,
    sources,
    sendMessage,
    handleAgentUpdate,
  };
}
