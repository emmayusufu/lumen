import type { Session, SessionDetail, Doc, DocDetail, UserSearchResult } from "@/lib/types";

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

export async function fetchDocs(): Promise<Doc[]> {
  const response = await fetch(`${API_BASE}/api/content/docs`);
  if (!response.ok) throw new Error(`Failed to fetch docs: ${response.statusText}`);
  return response.json();
}

export async function createDoc(title = "Untitled"): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE}/api/content/docs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error(`Failed to create doc: ${response.statusText}`);
  return response.json();
}

export async function fetchDoc(id: string): Promise<DocDetail> {
  const response = await fetch(`${API_BASE}/api/content/docs/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch doc: ${response.statusText}`);
  return response.json();
}

export async function updateDoc(id: string, patch: { title?: string; content?: string }): Promise<void> {
  const response = await fetch(`${API_BASE}/api/content/docs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!response.ok) throw new Error(`Failed to update doc: ${response.statusText}`);
}

export async function deleteDoc(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/content/docs/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to delete doc: ${response.statusText}`);
}

export async function searchUsers(email: string): Promise<UserSearchResult[]> {
  const response = await fetch(
    `${API_BASE}/api/users/search?email=${encodeURIComponent(email)}`,
  );
  if (!response.ok) throw new Error(`Failed to search users: ${response.statusText}`);
  return response.json();
}

export async function addCollaborator(
  docId: string,
  email: string,
  role: "editor" | "viewer",
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/content/docs/${docId}/collaborators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role }),
  });
  if (!response.ok) throw new Error(`Failed to add collaborator: ${response.statusText}`);
}

export async function removeCollaborator(docId: string, userId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/content/docs/${docId}/collaborators/${userId}`,
    { method: "DELETE" },
  );
  if (!response.ok) throw new Error(`Failed to remove collaborator: ${response.statusText}`);
}
