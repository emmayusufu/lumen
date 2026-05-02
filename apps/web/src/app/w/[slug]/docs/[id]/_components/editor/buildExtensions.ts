import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import { lowlight, LumenCodeBlock } from "./codeBlock";
import { Mermaid } from "./mermaid";
import { Plantuml } from "./plantuml";
import { CollaborationCursorExt, cursorColor } from "./collaborationCursor";
import { FactCheckDecorations } from "./factCheckDecorations";
import { CommentMark } from "./commentMark";

interface Options {
  provider: HocuspocusProvider | null;
  user: { id: string; name: string } | null;
}

export function buildExtensions({ provider, user }: Options) {
  const base = [
    StarterKit.configure({ codeBlock: false }),
    LumenCodeBlock.configure({ lowlight }),
    Placeholder.configure({
      placeholder: "Start writing, or type '/' for commands…",
      showOnlyCurrent: true,
    }),
    Image.configure({ HTMLAttributes: { class: "lumen-img" } }),
    Table.configure({
      resizable: true,
      HTMLAttributes: { class: "lumen-table" },
    }),
    TableRow,
    TableHeader,
    TableCell,
    Mermaid,
    Plantuml,
    CommentMark,
    FactCheckDecorations,
  ];
  if (!provider) return base;
  return [
    ...base,
    Collaboration.configure({ document: provider.document }),
    CollaborationCursorExt.configure({
      provider,
      user: user ? { name: user.name, color: cursorColor(user.id) } : null,
    }),
  ];
}
