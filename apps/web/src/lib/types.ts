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

export interface Profile {
  id: string;
  org_id: string;
  email: string;
  name: string;
  is_admin: boolean;
}

export interface CredentialInfo {
  configured: boolean;
  last_four: string | null;
  updated_at: string | null;
}

export interface CredentialsState {
  user: CredentialInfo;
  workspace: CredentialInfo;
}

export interface CollaboratorDocRef {
  doc_id: string;
  doc_title: string;
  role: "editor" | "viewer";
}

export interface CollaboratorSummary {
  user_id: string;
  email: string;
  display_name: string | null;
  doc_count: number;
  roles: string[];
  docs: CollaboratorDocRef[];
}
