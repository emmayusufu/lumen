"use client";

import { useRef, useState, useCallback } from "react";
import type { AgentUpdate } from "@/lib/types";
import { getWebSocketUrl } from "@/lib/api";

interface UseWebSocketReturn {
  send: (data: object) => void;
  isConnected: boolean;
  agentUpdates: AgentUpdate[];
  clearUpdates: () => void;
}

export function useWebSocket(
  onMessage: (update: AgentUpdate) => void,
): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [agentUpdates, setAgentUpdates] = useState<AgentUpdate[]>([]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(getWebSocketUrl());

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      const update: AgentUpdate = JSON.parse(event.data);
      setAgentUpdates((prev) => [...prev, update]);
      onMessage(update);
    };

    wsRef.current = ws;
  }, [onMessage]);

  const send = useCallback(
    (data: object) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connect();
        setTimeout(() => {
          wsRef.current?.send(JSON.stringify(data));
        }, 500);
      } else {
        wsRef.current.send(JSON.stringify(data));
      }
    },
    [connect],
  );

  const clearUpdates = useCallback(() => setAgentUpdates([]), []);

  return { send, isConnected, agentUpdates, clearUpdates };
}
