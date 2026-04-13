import type { Session, SessionDetail, Doc, DocDetail, UserSearchResult } from "@/lib/types";

const API_BASE = "/api/backend";

async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  return response;
}

export async function postResearch(query: string) {
  const response = await fetch(`${API_BASE}/api/v1/research`, {
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
  const response = await fetch(`${API_BASE}/api/v1/research/stream`, {
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
  const response = await apiFetch(`${API_BASE}/api/v1/sessions`);
  if (!response.ok) throw new Error(`Failed to fetch sessions: ${response.statusText}`);
  return response.json();
}

export async function fetchSession(id: string): Promise<SessionDetail> {
  const response = await apiFetch(`${API_BASE}/api/v1/sessions/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch session: ${response.statusText}`);
  return response.json();
}

export async function deleteSession(id: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/api/v1/sessions/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to delete session: ${response.statusText}`);
}

export async function fetchDocs(): Promise<Doc[]> {
  const response = await apiFetch(`${API_BASE}/api/v1/content/docs`);
  if (!response.ok) throw new Error(`Failed to fetch docs: ${response.statusText}`);
  return response.json();
}

export async function createDoc(title = "Untitled"): Promise<{ id: string }> {
  const response = await apiFetch(`${API_BASE}/api/v1/content/docs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error(`Failed to create doc: ${response.statusText}`);
  return response.json();
}

export async function fetchDoc(id: string): Promise<DocDetail> {
  const response = await apiFetch(`${API_BASE}/api/v1/content/docs/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch doc: ${response.statusText}`);
  return response.json();
}

export async function updateDoc(id: string, patch: { title?: string; content?: string }): Promise<void> {
  const response = await apiFetch(`${API_BASE}/api/v1/content/docs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!response.ok) throw new Error(`Failed to update doc: ${response.statusText}`);
}

export async function deleteDoc(id: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/api/v1/content/docs/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to delete doc: ${response.statusText}`);
}

export async function searchUsers(email: string): Promise<UserSearchResult[]> {
  const response = await apiFetch(
    `${API_BASE}/api/v1/users/search?email=${encodeURIComponent(email)}`,
  );
  if (!response.ok) throw new Error(`Failed to search users: ${response.statusText}`);
  return response.json();
}

export async function addCollaborator(
  docId: string,
  email: string,
  role: "editor" | "viewer",
): Promise<void> {
  const response = await apiFetch(`${API_BASE}/api/v1/content/docs/${docId}/collaborators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role }),
  });
  if (!response.ok) throw new Error(`Failed to add collaborator: ${response.statusText}`);
}

export async function removeCollaborator(docId: string, userId: string): Promise<void> {
  const response = await apiFetch(
    `${API_BASE}/api/v1/content/docs/${docId}/collaborators/${userId}`,
    { method: "DELETE" },
  );
  if (!response.ok) throw new Error(`Failed to remove collaborator: ${response.statusText}`);
}

export type InlineAction =
  | "improve"
  | "shorter"
  | "longer"
  | "grammar"
  | "tone"
  | "summarize"
  | "continue"
  | "outline"
  | "custom";

export type InlineTone =
  | "professional"
  | "casual"
  | "friendly"
  | "confident"
  | "persuasive";

export interface InlineAIRequest {
  action: InlineAction;
  tone?: InlineTone;
  prompt?: string;
  selection?: string;
  context?: string;
  topic?: string;
}

export type InlineEvent =
  | { type: "status"; stage: string; action?: string }
  | { type: "token"; text: string }
  | { type: "draft_complete"; text: string }
  | { type: "revision"; text: string }
  | { type: "done"; final: string }
  | { type: "error"; message: string };

export async function streamInlineAI(
  req: InlineAIRequest,
  onEvent: (event: InlineEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/ai/inline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Inline AI request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const lines = chunk.split("\n");
      let eventName = "";
      let dataStr = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) eventName = line.slice(7).trim();
        else if (line.startsWith("data: ")) dataStr = line.slice(6);
      }
      if (!eventName || !dataStr) continue;
      try {
        const parsed = JSON.parse(dataStr);
        onEvent({ type: eventName, ...parsed } as InlineEvent);
      } catch {
        // skip malformed
      }
    }
  }
}
