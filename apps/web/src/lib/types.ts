export interface ResearchResult {
  source_url: string;
  title: string;
  content_summary: string;
  relevance_score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Session {
  id: string;
  title: string;
  updated_at: string;
}

export interface SessionMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface SessionDetail extends Session {
  messages: SessionMessage[];
}

export interface Doc {
  id: string;
  title: string;
  updated_at: string;
  owner_id: string;
  role: "owner" | "editor" | "viewer";
}

export interface DocCollaborator {
  user_id: string;
  role: "editor" | "viewer";
  display_name: string | null;
  email: string | null;
}

export interface DocDetail extends Doc {
  content: string;
  collaborators: DocCollaborator[];
}

export interface UserSearchResult {
  user_id: string;
  display_name: string | null;
  email: string;
}
