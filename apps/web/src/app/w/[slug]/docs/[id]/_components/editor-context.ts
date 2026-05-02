import type { Editor } from "@tiptap/react";

interface EditorContext {
  selection: string;
  context: string;
  range: { from: number; to: number };
}

const CONTEXT_WINDOW = 800;
const MAX_CONTEXT_CHARS = 1600;

export function extractSelectionContext(editor: Editor): EditorContext {
  const { from, to } = editor.state.selection;
  const selection = editor.state.doc.textBetween(from, to, "\n");
  const blocks: string[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    const blockStart = pos;
    const blockEnd = pos + node.nodeSize;
    if (
      blockEnd >= from - CONTEXT_WINDOW &&
      blockStart <= to + CONTEXT_WINDOW
    ) {
      if (node.textContent) blocks.push(node.textContent);
    }
    return false;
  });
  return {
    selection,
    context: blocks.join("\n\n").slice(0, MAX_CONTEXT_CHARS),
    range: { from, to },
  };
}

export function extractCursorContext(editor: Editor): EditorContext {
  const { from } = editor.state.selection;
  const blocks: string[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    const blockStart = pos;
    const blockEnd = pos + node.nodeSize;
    if (blockEnd >= from - CONTEXT_WINDOW * 2 && blockStart <= from) {
      if (node.textContent) blocks.push(node.textContent);
    }
    return false;
  });
  return {
    selection: "",
    context: blocks.join("\n\n").slice(0, MAX_CONTEXT_CHARS),
    range: { from, to: from },
  };
}
