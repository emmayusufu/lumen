export interface ResearchResult {
  source_url: string;
  title: string;
  content_summary: string;
  relevance_score: number;
}

export interface CodeResult {
  source_url: string;
  language: string;
  code_snippet: string;
  description: string;
}

export interface AgentUpdate {
  type: "agent_update" | "done";
  agent?: string;
  data?: {
    messages?: Array<{ content: string; name: string }>;
    sub_tasks?: string[];
    research_results?: ResearchResult[];
    code_results?: CodeResult[];
    output?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export type OutputMode = "chat" | "report";
