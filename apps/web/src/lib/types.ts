export type WorkspaceRole = "admin" | "editor" | "viewer";
export type DocCollaboratorRole = "editor" | "viewer";

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  role: WorkspaceRole;
}

export interface Doc {
  id: string;
  title: string;
  updated_at: string;
  owner_id: string;
  workspace_slug: string;
  role: string;
  parent_id: string | null;
}

export interface DocCollaborator {
  user_id: string;
  role: DocCollaboratorRole;
  display_name: string | null;
  email: string | null;
}

export interface DocDetail extends Doc {
  content: string;
  workspace_id: string;
  visibility: "private" | "workspace";
  collaborators: DocCollaborator[];
}

export interface Profile {
  id: string;
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
  serper_user: CredentialInfo;
  serper_workspace: CredentialInfo;
}

interface CollaboratorDocRef {
  doc_id: string;
  doc_title: string;
  role: DocCollaboratorRole;
}

export interface CollaboratorSummary {
  user_id: string;
  email: string;
  display_name: string | null;
  doc_count: number;
  roles: string[];
  docs: CollaboratorDocRef[];
}
