import type { Session, SessionDetail } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8742";

export async function postResearch(query: string) {
  const response = await fetch(`${API_BASE}/api/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    throw new Error(`Research request failed: ${response.statusText}`);
  }
  return response.json();
}

export interface StreamEvent {
  agent?: string;
  type?: string;
  session_id?: string;
  data?: {
    output?: string;
    research_results?: Array<{
      source_url: string;
      title: string;
      content_summary: string;
    }>;
    completed_agents?: string[];
    next_agent?: string;
  };
}

export async function streamResearch(
  query: string,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/research/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Research request failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event: StreamEvent = JSON.parse(line.slice(6));
          onEvent(event);
        } catch {
          // skip malformed events
        }
      }
    }
  }
}

export async function fetchSessions(): Promise<Session[]> {
  const response = await fetch(`${API_BASE}/api/sessions`);
  if (!response.ok) throw new Error(`Failed to fetch sessions: ${response.statusText}`);
  return response.json();
}

export async function fetchSession(id: string): Promise<SessionDetail> {
  const response = await fetch(`${API_BASE}/api/sessions/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch session: ${response.statusText}`);
  return response.json();
}

export async function deleteSession(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/sessions/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to delete session: ${response.statusText}`);
}
