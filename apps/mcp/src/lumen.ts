export class LumenClient {
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.url}${path}`, {
      ...init,
      headers: {
        Cookie: `token=${this.token}`,
        "Content-Type": "application/json",
        ...(init?.headers as Record<string, string> | undefined),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Lumen ${init?.method ?? "GET"} ${path} failed (${res.status}): ${body}`);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  listWorkspaces() {
    return this.request<Workspace[]>("/api/backend/api/v1/workspaces");
  }

  listDocs(workspaceSlug?: string) {
    const qs = workspaceSlug ? `?workspace_slug=${encodeURIComponent(workspaceSlug)}` : "";
    return this.request<DocSummary[]>(`/api/backend/api/v1/content/docs${qs}`);
  }

  readDoc(docId: string) {
    return this.request<Doc>(`/api/backend/api/v1/content/docs/${docId}`);
  }

  createDoc(input: { workspace_slug: string; title: string; parent_id?: string }) {
    return this.request<{ id: string; workspace_slug: string }>(
      "/api/backend/api/v1/content/docs",
      { method: "POST", body: JSON.stringify(input) },
    );
  }

  patchDoc(docId: string, fields: { title?: string; content?: string }) {
    return this.request<void>(`/api/backend/api/v1/content/docs/${docId}`, {
      method: "PATCH",
      body: JSON.stringify(fields),
    });
  }

  listComments(docId: string) {
    return this.request<CommentThread[]>(`/api/backend/api/v1/content/docs/${docId}/comments`);
  }
}

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  role: "admin" | "editor" | "viewer";
}

export interface DocSummary {
  id: string;
  title: string;
  workspace_slug: string;
  parent_id: string | null;
  owner_id: string;
  role: string;
  updated_at: string;
}

export interface Doc extends DocSummary {
  content: string;
  visibility: "private" | "workspace";
}

export interface CommentThread {
  id: string;
  resolved: boolean;
  created_at: string;
  messages: { id: string; author_id: string; body: string; created_at: string }[];
}
