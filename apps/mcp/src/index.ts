#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { LumenClient } from "./lumen.js";

const LUMEN_URL = process.env.LUMEN_URL;
const LUMEN_TOKEN = process.env.LUMEN_TOKEN;

if (!LUMEN_URL || !LUMEN_TOKEN) {
  throw new Error("LUMEN_URL and LUMEN_TOKEN must be set in the environment.");
}

const siteUrl = LUMEN_URL.replace(/\/$/, "");
const lumen = new LumenClient(siteUrl, LUMEN_TOKEN);

const server = new McpServer({ name: "lumen-mcp", version: "0.1.0" });

const text = (value: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
    },
  ],
});

server.registerTool(
  "list_workspaces",
  {
    description:
      "List the workspaces the authenticated user belongs to. Returns id, slug, name, and the user's role in each.",
    inputSchema: {},
  },
  async () => text(await lumen.listWorkspaces()),
);

server.registerTool(
  "list_docs",
  {
    description:
      "List documents. Pass workspace_slug to filter to a specific workspace (use list_workspaces first to find the slug). Without it, returns all docs the user can read.",
    inputSchema: {
      workspace_slug: z
        .string()
        .optional()
        .describe("Slug of the workspace to filter by. Example: 'mia-sam-0cd3'."),
    },
  },
  async ({ workspace_slug }) => text(await lumen.listDocs(workspace_slug)),
);

server.registerTool(
  "read_doc",
  {
    description:
      "Read a doc by id. Returns title, HTML content, visibility, owner, parent_id, and timestamps. The content is rendered HTML (TipTap output), not markdown.",
    inputSchema: {
      doc_id: z.string().describe("UUID of the doc to read."),
    },
  },
  async ({ doc_id }) => {
    const doc = await lumen.readDoc(doc_id);
    return text({
      id: doc.id,
      title: doc.title,
      workspace_slug: doc.workspace_slug,
      parent_id: doc.parent_id,
      visibility: doc.visibility,
      updated_at: doc.updated_at,
      content: doc.content,
    });
  },
);

server.registerTool(
  "create_doc",
  {
    description:
      "Create a new doc in a workspace. Optionally set parent_id to nest under another doc, and content to seed initial HTML. Returns the new doc's id and a URL to open it.",
    inputSchema: {
      workspace_slug: z.string().describe("Slug of the workspace to create the doc in."),
      title: z.string().describe("Doc title."),
      parent_id: z
        .string()
        .optional()
        .describe("Optional UUID of the parent doc. If set, the new doc nests as a subpage."),
      content: z
        .string()
        .optional()
        .describe(
          "Optional initial content as HTML (TipTap-compatible). Example: '<h2>Heading</h2><p>Body.</p>'.",
        ),
    },
  },
  async ({ workspace_slug, title, parent_id, content }) => {
    const doc = await lumen.createDoc({ workspace_slug, title, parent_id });
    if (content && content.length > 0) {
      await lumen.patchDoc(doc.id, { content });
    }
    const url = `${siteUrl}/w/${doc.workspace_slug}/docs/${doc.id}`;
    return text(`Created doc ${doc.id}\n${url}`);
  },
);

server.registerTool(
  "append_to_doc",
  {
    description:
      "Append HTML content to the end of an existing doc. Reads current content, concatenates, and patches. Useful for adding sections, meeting notes, or follow-up bullets without overwriting.",
    inputSchema: {
      doc_id: z.string().describe("UUID of the doc to append to."),
      content: z.string().describe("HTML to append."),
    },
  },
  async ({ doc_id, content }) => {
    const existing = await lumen.readDoc(doc_id);
    const merged = (existing.content ?? "") + content;
    await lumen.patchDoc(doc_id, { content: merged });
    return text(`Appended ${content.length} characters to doc ${doc_id}.`);
  },
);

server.registerTool(
  "rename_doc",
  {
    description: "Rename a doc. Updates the title only; does not touch content.",
    inputSchema: {
      doc_id: z.string().describe("UUID of the doc."),
      title: z.string().describe("New title."),
    },
  },
  async ({ doc_id, title }) => {
    await lumen.patchDoc(doc_id, { title });
    return text(`Renamed doc ${doc_id} to "${title}".`);
  },
);

server.registerTool(
  "list_comments",
  {
    description:
      "List comment threads on a doc, including each thread's resolved state and message history. Useful for reviewing feedback before editing.",
    inputSchema: {
      doc_id: z.string().describe("UUID of the doc."),
    },
  },
  async ({ doc_id }) => text(await lumen.listComments(doc_id)),
);

const transport = new StdioServerTransport();
await server.connect(transport);
