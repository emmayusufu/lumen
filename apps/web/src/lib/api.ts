import type {
  CollaboratorSummary,
  CredentialsState,
  Doc,
  DocDetail,
  Profile,
  Workspace,
} from "@/lib/types";

const API_BASE = "/api/backend";

async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status === 401) {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/signup") && !window.location.pathname.startsWith("/invite/")) {
      window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
    throw new Error("Unauthorized");
  }
  return response;
}

export async function fetchDocs(workspaceSlug?: string): Promise<Doc[]> {
  const url = workspaceSlug
    ? `${API_BASE}/api/v1/content/docs?workspace_slug=${encodeURIComponent(workspaceSlug)}`
    : `${API_BASE}/api/v1/content/docs`;
  const response = await apiFetch(url);
  if (!response.ok)
    throw new Error(`Failed to fetch docs: ${response.statusText}`);
  return response.json();
}

export async function createDocInWorkspace(
  slug: string,
  title = "Untitled",
  parentId: string | null = null,
): Promise<{ id: string; workspace_slug: string }> {
  const res = await apiFetch(`${API_BASE}/api/v1/content/docs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, workspace_slug: slug, parent_id: parentId }),
  });
  if (!res.ok) throw new Error(`Failed to create doc: ${res.statusText}`);
  return res.json();
}

export async function moveDoc(docId: string, parentId: string | null): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/v1/content/docs/${docId}/move`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parent_id: parentId }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Failed to move: ${res.statusText}`);
  }
}

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const res = await apiFetch(`${API_BASE}/api/v1/workspaces`);
  if (!res.ok) throw new Error(`Failed to fetch workspaces: ${res.statusText}`);
  return res.json();
}

export async function createWorkspace(name: string): Promise<Workspace> {
  const res = await apiFetch(`${API_BASE}/api/v1/workspaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`Failed to create workspace: ${res.statusText}`);
  return res.json();
}

export async function fetchMembers(slug: string): Promise<
  Array<{
    user_id: string;
    name: string;
    email: string;
    role: string;
    joined_at: string;
  }>
> {
  const res = await apiFetch(`${API_BASE}/api/v1/w/${slug}/members`);
  if (!res.ok) throw new Error(`Failed to fetch members: ${res.statusText}`);
  return res.json();
}

export async function changeMemberRole(
  slug: string,
  userId: string,
  role: "admin" | "editor" | "viewer",
): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/v1/w/${slug}/members/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const text = await res.text();
    let detail = "Failed to change role";
    try {
      detail = (JSON.parse(text) as { detail?: string }).detail ?? detail;
    } catch {}
    throw new Error(detail);
  }
}

export async function removeMember(
  slug: string,
  userId: string,
): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/v1/w/${slug}/members/${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    let detail = "Failed to remove member";
    try {
      detail = (JSON.parse(text) as { detail?: string }).detail ?? detail;
    } catch {}
    throw new Error(detail);
  }
}

export async function mintInvite(
  slug: string,
  role: "admin" | "editor" | "viewer",
): Promise<{ token: string; url: string; role: string; expires_at: string }> {
  const res = await apiFetch(`${API_BASE}/api/v1/w/${slug}/invites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error(`Failed to mint invite: ${res.statusText}`);
  return res.json();
}

export async function listInvites(slug: string): Promise<unknown> {
  const res = await apiFetch(`${API_BASE}/api/v1/w/${slug}/invites`);
  if (!res.ok) throw new Error(`Failed to list invites: ${res.statusText}`);
  return res.json();
}

export async function revokeInvite(slug: string, token: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/v1/w/${slug}/invites/${token}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Failed to revoke invite: ${res.statusText}`);
}

export async function previewInvite(token: string): Promise<{
  workspace_name: string;
  workspace_slug: string;
  role: string;
  inviter_name: string | null;
  expired: boolean;
} | null> {
  const res = await fetch(`${API_BASE}/api/v1/invites/${token}`);
  if (!res.ok) return null;
  return res.json();
}

export async function acceptInvite(
  token: string,
): Promise<{ id: string; slug: string; name: string }> {
  const res = await apiFetch(`${API_BASE}/api/v1/invites/${token}/accept`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Failed to accept invite: ${res.statusText}`);
  return res.json();
}

export async function signupViaInvite(
  token: string,
  body: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  },
): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api/v1/invites/${token}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Signup failed: ${res.statusText}`);
  return res.json();
}

export async function renameWorkspace(
  slug: string,
  name: string,
): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/v1/w/${slug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`Rename failed: ${res.statusText}`);
}

export async function fetchDoc(id: string): Promise<DocDetail> {
  const response = await apiFetch(`${API_BASE}/api/v1/content/docs/${id}`);
  if (!response.ok)
    throw new Error(`Failed to fetch doc: ${response.statusText}`);
  return response.json();
}

export async function updateDoc(
  id: string,
  patch: { title?: string; content?: string },
): Promise<void> {
  const response = await apiFetch(`${API_BASE}/api/v1/content/docs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!response.ok)
    throw new Error(`Failed to update doc: ${response.statusText}`);
}

export async function deleteDoc(id: string): Promise<void> {
  const response = await apiFetch(`${API_BASE}/api/v1/content/docs/${id}`, {
    method: "DELETE",
  });
  if (!response.ok)
    throw new Error(`Failed to delete doc: ${response.statusText}`);
}

export async function addCollaborator(
  docId: string,
  email: string,
  role: "editor" | "viewer",
): Promise<void> {
  const response = await apiFetch(
    `${API_BASE}/api/v1/content/docs/${docId}/collaborators`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    },
  );
  if (!response.ok) {
    const text = await response.text();
    let detail = "Failed to add collaborator";
    try {
      detail = (JSON.parse(text) as { detail?: string }).detail ?? detail;
    } catch {}
    throw new Error(detail);
  }
}

export async function updateCollaboratorRole(
  docId: string,
  userId: string,
  role: "editor" | "viewer",
): Promise<void> {
  const response = await apiFetch(
    `${API_BASE}/api/v1/content/docs/${docId}/collaborators/${userId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );
  if (!response.ok)
    throw new Error(`Failed to update role: ${response.statusText}`);
}

export async function removeCollaborator(
  docId: string,
  userId: string,
): Promise<void> {
  const response = await apiFetch(
    `${API_BASE}/api/v1/content/docs/${docId}/collaborators/${userId}`,
    { method: "DELETE" },
  );
  if (!response.ok)
    throw new Error(`Failed to remove collaborator: ${response.statusText}`);
}

export async function updateDocVisibility(
  docId: string,
  visibility: "private" | "workspace",
): Promise<void> {
  const response = await apiFetch(
    `${API_BASE}/api/v1/content/docs/${docId}/visibility`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility }),
    },
  );
  if (!response.ok)
    throw new Error(`Failed to update visibility: ${response.statusText}`);
}

interface CommentMessage {
  id: string;
  thread_id: string;
  author_id: string;
  author_name: string | null;
  author_email: string | null;
  body: string;
  created_at: string;
}

export interface CommentThread {
  id: string;
  doc_id: string;
  resolved: boolean;
  created_by: string;
  creator_name: string | null;
  creator_email: string | null;
  created_at: string;
  messages: CommentMessage[];
}

export async function fetchComments(docId: string): Promise<CommentThread[]> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/content/docs/${docId}/comments`,
  );
  if (!res.ok) throw new Error(`Failed to load comments: ${res.statusText}`);
  return res.json();
}

export async function createCommentThread(
  docId: string,
  threadId: string,
  body: string,
): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/content/docs/${docId}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id: threadId, body }),
    },
  );
  if (!res.ok) throw new Error(`Failed to create comment: ${res.statusText}`);
}

export async function replyToCommentThread(
  threadId: string,
  body: string,
): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/content/comments/${threadId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    },
  );
  if (!res.ok) throw new Error(`Failed to reply: ${res.statusText}`);
}

export async function setCommentResolved(
  threadId: string,
  resolved: boolean,
): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/content/comments/${threadId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolved }),
    },
  );
  if (!res.ok) throw new Error(`Failed to update comment: ${res.statusText}`);
}

export async function deleteCommentThread(threadId: string): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/content/comments/${threadId}`,
    {
      method: "DELETE",
    },
  );
  if (!res.ok) throw new Error(`Failed to delete comment: ${res.statusText}`);
}

export type SummaryLength = "short" | "medium" | "long";

export async function streamDocSummary(
  docId: string,
  length: SummaryLength,
  onToken: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/v1/ai/summarize/${docId}?length=${length}`,
    { signal },
  );
  if (!res.ok) {
    let message = `Summary failed: ${res.statusText}`;
    try {
      const data = await res.json();
      const detail = data?.detail;
      if (typeof detail === "string") message = detail;
      else if (detail?.message) message = detail.message;
    } catch {}
    throw new Error(message);
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const block of events) {
      let event = "message";
      let data = "";
      for (const line of block.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7);
        else if (line.startsWith("data: ")) data = line.slice(6);
      }
      if (!data) continue;
      try {
        const payload = JSON.parse(data) as { text?: string; message?: string };
        if (event === "token" && payload.text) onToken(payload.text);
        if (event === "error")
          throw new Error(payload.message ?? "Summary failed");
        if (event === "done") return;
      } catch (err) {
        if (event === "error") throw err;
      }
    }
  }
}

export async function uploadImage(file: File): Promise<string> {
  const presignRes = await apiFetch(`${API_BASE}/api/v1/uploads/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content_type: file.type, kind: "image" }),
  });
  if (!presignRes.ok)
    throw new Error(`Presign failed: ${presignRes.statusText}`);
  const { put_url, public_url, max_bytes } = await presignRes.json();

  if (file.size > max_bytes) {
    throw new Error(
      `Image too large. Max ${Math.floor(max_bytes / 1024 / 1024)}MB`,
    );
  }

  const putRes = await fetch(put_url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error(`Upload failed: ${putRes.statusText}`);

  return public_url;
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

  if (response.status === 400) {
    const body = await response.json().catch(() => ({}));
    const detail = body.detail;
    if (
      detail &&
      typeof detail === "object" &&
      detail.code === "no_credentials"
    ) {
      throw Object.assign(
        new Error(detail.message ?? "Configure AI in Settings."),
        {
          code: "no_credentials" as const,
        },
      );
    }
  }

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
      } catch {}
    }
  }
}

export async function fetchProfile(): Promise<Profile> {
  const res = await apiFetch(`${API_BASE}/api/v1/settings/profile`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function updateProfile(patch: {
  name?: string;
  email?: string;
  current_password?: string;
}): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/v1/settings/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? "Update failed");
  }
}

export async function changePassword(body: {
  current_password: string;
  new_password: string;
}): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/v1/settings/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Password change failed");
  }
}

export async function fetchCredentials(): Promise<CredentialsState> {
  const res = await apiFetch(`${API_BASE}/api/v1/settings/credentials`);
  if (!res.ok) throw new Error("Failed to fetch credentials");
  return res.json();
}

export async function setUserCredential(api_key: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/v1/settings/credentials/user`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key }),
  });
  if (!res.ok) throw new Error("Failed to set credential");
}

export async function deleteUserCredential(): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/v1/settings/credentials/user`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete credential");
}

export async function setWorkspaceCredential(api_key: string): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/settings/credentials/workspace`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key }),
    },
  );
  if (!res.ok) throw new Error("Failed to set workspace credential");
}

export async function deleteWorkspaceCredential(): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/settings/credentials/workspace`,
    {
      method: "DELETE",
    },
  );
  if (!res.ok) throw new Error("Failed to delete workspace credential");
}

export async function setSerperUserCredential(api_key: string): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/settings/credentials/serper-user`,
    { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key }) },
  );
  if (!res.ok) throw new Error("Failed to set Serper key");
}

export async function deleteSerperUserCredential(): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/settings/credentials/serper-user`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error("Failed to delete Serper key");
}

export async function setSerperWorkspaceCredential(api_key: string): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/settings/credentials/serper-workspace`,
    { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key }) },
  );
  if (!res.ok) throw new Error("Failed to set workspace Serper key");
}

export async function deleteSerperWorkspaceCredential(): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/settings/credentials/serper-workspace`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error("Failed to delete workspace Serper key");
}

export async function streamFactCheck(
  docId: string,
  onEvent: (event: string, data: unknown) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/v1/ai/factcheck/${docId}`,
    { signal },
  );
  if (!res.ok) {
    let message = `Fact check failed: ${res.statusText}`;
    try {
      const d = await res.json();
      const detail = d?.detail;
      if (typeof detail === "string") message = detail;
      else if (detail?.message) message = detail.message;
    } catch {}
    throw new Error(message);
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      let event = "message";
      let data = "";
      for (const line of block.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7);
        else if (line.startsWith("data: ")) data = line.slice(6);
      }
      if (!data) continue;
      try {
        onEvent(event, JSON.parse(data));
      } catch {}
    }
  }
}

export async function fetchMyCollaborators(): Promise<CollaboratorSummary[]> {
  const res = await apiFetch(`${API_BASE}/api/v1/content/collaborators/my`);
  if (!res.ok) throw new Error("Failed to fetch collaborators");
  return res.json();
}

export async function bulkRemoveCollaborator(
  userId: string,
): Promise<{ removed_count: number }> {
  const res = await apiFetch(
    `${API_BASE}/api/v1/content/collaborators/${userId}`,
    {
      method: "DELETE",
    },
  );
  if (!res.ok) throw new Error("Failed to remove collaborator");
  return res.json();
}
