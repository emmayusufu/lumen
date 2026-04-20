"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import { Extension } from "@tiptap/core";
import { yCursorPlugin } from "@tiptap/y-tiptap";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import { createLowlight, common } from "lowlight";
import { CodeBlock } from "./CodeBlock";
import { AIPanel } from "./ai/AIPanel";
import { CommentComposer } from "./CommentComposer";
import { uploadImage } from "@/lib/api";
import { CommentMark } from "@/lib/commentMark";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import Tooltip from "@mui/material/Tooltip";
import type { Editor } from "@tiptap/react";
import { extractCursorContext, extractSelectionContext } from "@/lib/editor-context";
import { looksLikeMarkdown, markdownToHtml } from "@/lib/markdown";

const CURSOR_COLORS = ["#8B9B6E", "#B8804A", "#6E8B9B", "#9B6E8B", "#6E9B8B", "#9B8B6E"];

function cursorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

const CollaborationCursorExt = Extension.create<{ provider: HocuspocusProvider | null; user: { name: string; color: string } | null }>({
  name: "collaborationCursor",
  addOptions() {
    return { provider: null, user: null };
  },
  addProseMirrorPlugins() {
    const { provider, user } = this.options;
    if (!provider?.awareness) return [];
    if (user) provider.awareness.setLocalStateField("user", user);
    return [yCursorPlugin(provider.awareness)];
  },
});

interface DocEditorProps {
  content: string;
  readOnly: boolean;
  user?: { id: string; name: string };
  provider: HocuspocusProvider | null;
  synced: boolean;
  onContentSave: (content: string) => void;
  onContentChange?: (content: string) => void;
  onAskAI?: () => void;
  onCreateComment?: (threadId: string, body: string) => Promise<void>;
  onOpenThread?: (threadId: string) => void;
  threadIds?: string[];
}

const withSlashDelete = (fn: (e: Editor) => void) => (e: Editor) => {
  const { $anchor } = e.state.selection;
  if ($anchor.parent.textContent === "/") {
    e.chain().deleteRange({ from: $anchor.pos - 1, to: $anchor.pos }).run();
  }
  fn(e);
};

const editorSx = {
  "& .ProseMirror-yjs-cursor": {
    position: "relative",
    marginLeft: "-1px",
    marginRight: "-1px",
    borderLeft: "2px solid",
    borderRight: "none",
    wordBreak: "normal",
    pointerEvents: "none",
    "& > div": {
      position: "absolute",
      top: "-1.4em",
      left: "-1px",
      fontSize: "0.65rem",
      fontWeight: 600,
      lineHeight: "normal",
      padding: "1px 5px",
      borderRadius: "3px 3px 3px 0",
      color: "#fff",
      whiteSpace: "nowrap",
      pointerEvents: "none",
    },
  },
  "& .ProseMirror": {
    outline: "none",
    minHeight: "60vh",
    fontSize: "1.02rem",
    lineHeight: 1.78,
    color: "text.primary",
    caretColor: "primary.main",
    "& .is-empty::before": {
      content: "attr(data-placeholder)",
      float: "left",
      color: "text.disabled",
      pointerEvents: "none",
      height: 0,
      fontStyle: "italic",
    },
    "& h1": { fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2, mt: "1.6em", mb: "0.3em" },
    "& h2": { fontSize: "1.38rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.3, mt: "1.4em", mb: "0.3em" },
    "& h3": { fontSize: "1.12rem", fontWeight: 700, letterSpacing: "-0.01em", mt: "1.15em", mb: "0.25em" },
    "& blockquote": {
      borderLeft: "3px solid",
      borderColor: "primary.main",
      pl: 2.5,
      color: "text.secondary",
      my: 2,
      ml: 0,
      fontStyle: "italic",
      opacity: 0.85,
    },
    "& ul, & ol": { pl: 3 },
    "& li + li": { mt: 0.375 },
    "& p": { my: 0.75 },
    "& p:first-of-type": { mt: 0 },
    "& img.lumen-img": {
      maxWidth: "100%",
      height: "auto",
      borderRadius: "6px",
      display: "block",
      my: 1.5,
    },
    "& .lumen-comment": {
      backgroundColor: "rgba(228, 184, 74, 0.22)",
      borderBottom: "1.5px solid rgba(184, 128, 74, 0.55)",
      borderRadius: "2px",
      cursor: "pointer",
      padding: "0 1px",
      transition: "background-color 0.15s",
      "&:hover": { backgroundColor: "rgba(228, 184, 74, 0.38)" },
    },
    "& .tableWrapper": {
      overflowX: "auto",
      my: 1.5,
    },
    "& .tableWrapper table": {
      width: "100%",
      borderCollapse: "collapse",
      tableLayout: "fixed",
      "& td, & th": {
        border: "1px solid",
        borderColor: "divider",
        padding: "8px 12px",
        verticalAlign: "top",
        position: "relative",
        "& > *": { mt: 0, mb: 0 },
      },
      "& th": {
        backgroundColor: "action.hover",
        fontWeight: 700,
        textAlign: "left",
      },
      "& .selectedCell": {
        backgroundColor: "rgba(139,155,110,0.12)",
      },
      "& .column-resize-handle": {
        position: "absolute",
        right: "-2px",
        top: 0,
        bottom: 0,
        width: "4px",
        backgroundColor: "primary.main",
        opacity: 0.25,
        pointerEvents: "none",
      },
    },
    "&.resize-cursor": { cursor: "col-resize" },
  },
};

const FORMATS = [
  { Icon: FormatBoldIcon, mark: "bold", fn: (e: Editor) => e.chain().focus().toggleBold().run() },
  { Icon: FormatItalicIcon, mark: "italic", fn: (e: Editor) => e.chain().focus().toggleItalic().run() },
  { Icon: FormatStrikethroughIcon, mark: "strike", fn: (e: Editor) => e.chain().focus().toggleStrike().run() },
  { Icon: CodeRoundedIcon, mark: "code", fn: (e: Editor) => e.chain().focus().toggleCode().run() },
];

type BlockGroup = {
  label: string;
  items: { label: string; hint: string; Icon: React.ElementType; cmd: (e: Editor) => void }[];
};

const H = (text: string) => () => (
  <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, lineHeight: 1, color: "text.secondary", minWidth: 14 }}>
    {text}
  </Typography>
);

const BASE_BLOCK_GROUPS: BlockGroup[] = [
  {
    label: "Text",
    items: [
      { label: "Text", hint: "Plain paragraph", Icon: NotesRoundedIcon, cmd: withSlashDelete((e) => e.chain().focus().setParagraph().run()) },
      { label: "Heading 1", hint: "Big title", Icon: H("H1"), cmd: withSlashDelete((e) => e.chain().focus().setHeading({ level: 1 }).run()) },
      { label: "Heading 2", hint: "Section title", Icon: H("H2"), cmd: withSlashDelete((e) => e.chain().focus().setHeading({ level: 2 }).run()) },
      { label: "Heading 3", hint: "Sub-section", Icon: H("H3"), cmd: withSlashDelete((e) => e.chain().focus().setHeading({ level: 3 }).run()) },
    ],
  },
  {
    label: "List",
    items: [
      { label: "Bullet list", hint: "Unordered", Icon: FormatListBulletedRoundedIcon, cmd: withSlashDelete((e) => e.chain().focus().toggleBulletList().run()) },
      { label: "Numbered list", hint: "Ordered", Icon: FormatListNumberedRoundedIcon, cmd: withSlashDelete((e) => e.chain().focus().toggleOrderedList().run()) },
    ],
  },
  {
    label: "Other",
    items: [
      { label: "Code block", hint: "Monospace", Icon: CodeRoundedIcon, cmd: withSlashDelete((e) => e.chain().focus().toggleCodeBlock().run()) },
      { label: "Quote", hint: "Callout", Icon: FormatQuoteRoundedIcon, cmd: withSlashDelete((e) => e.chain().focus().toggleBlockquote().run()) },
      { label: "Table", hint: "3×3 grid", Icon: TableChartOutlinedIcon, cmd: withSlashDelete((e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()) },
    ],
  },
];

const customCommon = { ...common };
delete (customCommon as Record<string, unknown>).shell;
delete (customCommon as Record<string, unknown>)["python-repl"];
delete (customCommon as Record<string, unknown>)["php-template"];
const lowlight = createLowlight(customCommon as typeof common);

const LumenCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlock);
  },
});

export function DocEditor({ content, readOnly, user, provider, synced, onContentSave, onContentChange, onAskAI, onCreateComment, onOpenThread, threadIds }: DocEditorProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string>(content);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiAnchor, setAiAnchor] = useState<{ nodeType: 1; getBoundingClientRect: () => DOMRect } | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState<"selection" | "generate">("selection");
  const [aiSelection, setAiSelection] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [aiRange, setAiRange] = useState<{ from: number; to: number } | null>(null);
  const [commentAnchor, setCommentAnchor] = useState<{ nodeType: 1; getBoundingClientRect: () => DOMRect } | null>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentSnippet, setCommentSnippet] = useState("");
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null);
  const [pendingRange, setPendingRange] = useState<{ from: number; to: number } | null>(null);

  const flushSave = (html: string) => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (html !== lastSaved.current) {
      lastSaved.current = html;
      onContentSave(html);
    }
  };

  const scheduleSave = (html: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      if (html !== lastSaved.current) {
        lastSaved.current = html;
        onContentSave(html);
      }
    }, 800);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      LumenCodeBlock.configure({ lowlight }),
      Placeholder.configure({ placeholder: "Start writing, or type '/' for commands…", showOnlyCurrent: true }),
      Image.configure({ HTMLAttributes: { class: "lumen-img" } }),
      Table.configure({ resizable: true, HTMLAttributes: { class: "lumen-table" } }),
      TableRow,
      TableHeader,
      TableCell,
      CommentMark,
      ...(provider ? [
        Collaboration.configure({ document: provider.document }),
        CollaborationCursorExt.configure({
          provider,
          user: user ? { name: user.name, color: cursorColor(user.id) } : null,
        }),
      ] : []),
    ],
    content: provider ? undefined : content,
    editable: !readOnly,
    immediatelyRender: false,
    editorProps: {
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        void Promise.all(files.map(uploadImage)).then((urls) => {
          urls.forEach((url) => {
            view.dispatch(
              view.state.tr.replaceSelectionWith(
                view.state.schema.nodes.image.create({ src: url }),
              ),
            );
          });
        });
        return true;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        const pos = coords?.pos ?? view.state.selection.from;
        void Promise.all(files.map(uploadImage)).then((urls) => {
          urls.forEach((url) => {
            view.dispatch(
              view.state.tr.insert(pos, view.state.schema.nodes.image.create({ src: url })),
            );
          });
        });
        return true;
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      onContentChange?.(html);
      scheduleSave(html);
    },
    onBlur: ({ editor: e }) => flushSave(e.getHTML()),
  }, [provider]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  useEffect(() => {
    if (!provider?.awareness || !user) return;
    provider.awareness.setLocalStateField("user", { name: user.name, color: cursorColor(user.id) });
  }, [provider, user]);

  useEffect(() => {
    if (!editor || !provider || !synced) return;
    const fragment = provider.document.getXmlFragment("default");
    if (fragment.length === 0 && content) {
      editor.commands.setContent(content);
    }
  }, [editor, provider, synced]);

  useEffect(() => {
    if (!editor || editor.getHTML() === content) return;
    editor.commands.setContent(content, false as never);
  }, [content]);

  useEffect(() => {
    if (!onAskAI) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); onAskAI(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onAskAI]);

  const prevThreadIdsRef = useRef<string[] | null>(null);
  useEffect(() => {
    if (!editor || !threadIds || readOnly) return;
    const prev = prevThreadIdsRef.current;
    prevThreadIdsRef.current = threadIds;
    const active = new Set(threadIds);
    const stale: string[] = [];
    if (prev === null) {
      editor.state.doc.descendants((node) => {
        if (!node.isInline) return;
        for (const m of node.marks) {
          const tid = m.attrs.threadId;
          if (m.type.name === "comment" && tid && !active.has(tid) && !stale.includes(tid)) {
            stale.push(tid);
          }
        }
      });
    } else {
      for (const tid of prev) {
        if (!active.has(tid) && !stale.includes(tid)) stale.push(tid);
      }
    }
    if (stale.length === 0) return;
    editor.commands.command(({ tr, state, dispatch }) => {
      const commentMark = state.schema.marks.comment;
      if (!commentMark) return false;
      state.doc.descendants((node, pos) => {
        if (!node.isInline) return;
        node.marks.forEach((m) => {
          if (m.type.name === "comment" && stale.includes(m.attrs.threadId)) {
            tr.removeMark(pos, pos + node.nodeSize, m);
          }
        });
      });
      if (dispatch) dispatch(tr);
      return true;
    });
  }, [editor, threadIds, readOnly]);

  useEffect(() => {
    if (!editor || !onOpenThread) return;
    let dom: Element | null = null;
    const click = (e: Event) => {
      const target = e.target as HTMLElement;
      const el = target.closest(".lumen-comment") as HTMLElement | null;
      const threadId = el?.getAttribute("data-thread-id");
      if (threadId) {
        e.preventDefault();
        onOpenThread(threadId);
      }
    };
    const attach = () => {
      try {
        dom = editor.view.dom;
        dom.addEventListener("click", click);
      } catch {
        // view not ready yet
      }
    };
    attach();
    if (!dom) editor.on("create", attach);
    return () => {
      editor.off("create", attach);
      if (dom) dom.removeEventListener("click", click);
    };
  }, [editor, onOpenThread]);

  const openAIFromSelection = () => {
    if (!editor) return;
    const { selection, context, range } = extractSelectionContext(editor);
    if (!selection) return;
    const startCoords = editor.view.coordsAtPos(range.from);
    const endCoords = editor.view.coordsAtPos(range.to);
    const rect = new DOMRect(
      startCoords.left,
      Math.max(startCoords.bottom, endCoords.bottom),
      Math.max(1, endCoords.right - startCoords.left),
      1,
    );
    setAiAnchor({ nodeType: 1, getBoundingClientRect: () => rect });
    setAiSelection(selection);
    setAiContext(context);
    setAiRange(range);
    setAiMode("selection");
    setAiOpen(true);
  };

  const openCommentComposer = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const snippet = editor.state.doc.textBetween(from, to, " ").trim();
    const startCoords = editor.view.coordsAtPos(from);
    const endCoords = editor.view.coordsAtPos(to);
    const rect = new DOMRect(
      startCoords.left,
      Math.max(startCoords.bottom, endCoords.bottom),
      Math.max(1, endCoords.right - startCoords.left),
      1,
    );
    setCommentAnchor({ nodeType: 1, getBoundingClientRect: () => rect });
    setCommentSnippet(snippet);
    setPendingRange({ from, to });
    setPendingThreadId(crypto.randomUUID());
    setCommentOpen(true);
  };

  const submitComment = async (body: string) => {
    if (!editor || !pendingThreadId || !pendingRange || !onCreateComment) return;
    editor
      .chain()
      .setTextSelection({ from: pendingRange.from, to: pendingRange.to })
      .setComment(pendingThreadId)
      .run();
    try {
      await onCreateComment(pendingThreadId, body);
    } catch (err) {
      editor.chain().unsetComment(pendingThreadId).run();
      throw err;
    }
  };

  const openAIFromCursor = () => {
    if (!editor) return;
    const { context, range } = extractCursorContext(editor);
    const coords = editor.view.coordsAtPos(range.from);
    const rect = new DOMRect(coords.left, coords.bottom, 1, 1);
    setAiAnchor({ nodeType: 1, getBoundingClientRect: () => rect });
    setAiSelection("");
    setAiContext(context);
    setAiRange(range);
    setAiMode("generate");
    setAiOpen(true);
  };

  const toInsertable = (text: string): string => {
    return looksLikeMarkdown(text) ? markdownToHtml(text) : text;
  };

  const handleAIReplace = (text: string) => {
    if (!editor || !aiRange) return;
    editor
      .chain()
      .focus()
      .setTextSelection({ from: aiRange.from, to: aiRange.to })
      .deleteSelection()
      .insertContent(toInsertable(text))
      .run();
  };

  const handleAIInsertBelow = (text: string) => {
    if (!editor || !aiRange) return;
    editor
      .chain()
      .focus()
      .setTextSelection(aiRange.to)
      .insertContent({ type: "paragraph" })
      .insertContent(toInsertable(text))
      .run();
  };

  const blockGroups = useMemo<BlockGroup[]>(
    () => [
      {
        label: "AI",
        items: [
          {
            label: "Ask AI",
            hint: "Rewrite or generate",
            Icon: AutoAwesomeRoundedIcon,
            cmd: withSlashDelete(() => openAIFromCursor()),
          },
        ],
      },
      ...BASE_BLOCK_GROUPS,
      {
        label: "Media",
        items: [
          {
            label: "Image",
            hint: "Upload from device",
            Icon: ImageOutlinedIcon,
            cmd: withSlashDelete(() => fileInputRef.current?.click()),
          },
        ],
      },
    ],
    [editor],
  );

  return (
    <Box sx={editorSx}>
      {editor !== null && <BubbleMenu
        editor={editor}
        shouldShow={({ editor: e, state }) => !state.selection.empty && !e.isActive("table")}
      >
        <Paper
          elevation={0}
          sx={(theme) => ({
            display: "flex",
            p: 0.5,
            gap: 0.25,
            borderRadius: "9px",
            border: "1px solid",
            borderColor: "divider",
            backdropFilter: "blur(16px)",
            bgcolor: "rgba(255,255,255,0.92)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.8) inset",
            ...theme.applyStyles("dark", {
              backgroundColor: "rgba(28,28,28,0.88)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset",
            }),
          })}
        >
          <IconButton
            size="small"
            onClick={openAIFromSelection}
            sx={(theme) => ({
              p: 0.625,
              borderRadius: "6px",
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              gap: 0.25,
              "&:hover": { bgcolor: "rgba(139,155,110,0.14)" },
              ...theme.applyStyles("dark", {
                "&:hover": { backgroundColor: "rgba(186,200,160,0.14)" },
              }),
            })}
          >
            <AutoAwesomeRoundedIcon sx={{ fontSize: 13 }} />
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.02em" }}>
              AI
            </Typography>
          </IconButton>
          <Box
            sx={{
              width: "1px",
              height: 16,
              mx: 0.375,
              backgroundColor: "divider",
              alignSelf: "center",
            }}
          />
          {FORMATS.map(({ Icon, mark, fn }) => (
            <IconButton
              key={mark}
              size="small"
              onClick={() => editor && fn(editor)}
              sx={(theme) => ({
                p: 0.625,
                borderRadius: "6px",
                color: editor?.isActive(mark) ? "primary.main" : "text.secondary",
                bgcolor: editor?.isActive(mark) ? "rgba(163,176,135,0.12)" : "transparent",
                "&:hover": { bgcolor: "action.hover" },
                transition: "all 0.1s ease",
                ...theme.applyStyles("dark", {
                  backgroundColor: editor?.isActive(mark) ? "rgba(186,200,160,0.15)" : "transparent",
                }),
              })}
            >
              <Icon sx={{ fontSize: 14 }} />
            </IconButton>
          ))}
          {onCreateComment && (
            <>
              <Box
                sx={{
                  width: "1px",
                  height: 16,
                  mx: 0.375,
                  backgroundColor: "divider",
                  alignSelf: "center",
                }}
              />
              <IconButton
                size="small"
                onClick={openCommentComposer}
                sx={{
                  p: 0.625,
                  borderRadius: "6px",
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover", color: "text.primary" },
                }}
              >
                <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </>
          )}
        </Paper>
      </BubbleMenu>}

      {editor !== null && !readOnly && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: e }) => e.isActive("table")}
        >
          <Paper
            elevation={0}
            sx={(theme) => ({
              display: "flex",
              p: 0.5,
              gap: 0.25,
              borderRadius: "9px",
              border: "1px solid",
              borderColor: "divider",
              backdropFilter: "blur(16px)",
              bgcolor: "rgba(255,255,255,0.92)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
              ...theme.applyStyles("dark", { backgroundColor: "rgba(28,28,28,0.88)" }),
            })}
          >
            {[
              { label: "Add column", Icon: AddRoundedIcon, suffix: "col", fn: (e: Editor) => e.chain().focus().addColumnAfter().run() },
              { label: "Add row", Icon: AddRoundedIcon, suffix: "row", fn: (e: Editor) => e.chain().focus().addRowAfter().run() },
              { label: "Delete column", Icon: RemoveRoundedIcon, suffix: "col", fn: (e: Editor) => e.chain().focus().deleteColumn().run() },
              { label: "Delete row", Icon: RemoveRoundedIcon, suffix: "row", fn: (e: Editor) => e.chain().focus().deleteRow().run() },
              { label: "Delete table", Icon: DeleteOutlineRoundedIcon, suffix: "", fn: (e: Editor) => e.chain().focus().deleteTable().run(), danger: true },
            ].map(({ label, Icon, suffix, fn, danger }) => (
              <Tooltip key={label} title={label} arrow>
                <IconButton
                  size="small"
                  onClick={() => editor && fn(editor)}
                  sx={{
                    p: 0.625,
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.25,
                    color: danger ? "error.main" : "text.secondary",
                    "&:hover": { bgcolor: "action.hover", color: danger ? "error.main" : "text.primary" },
                  }}
                >
                  <Icon sx={{ fontSize: 14 }} />
                  {suffix && (
                    <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.02em" }}>
                      {suffix}
                    </Typography>
                  )}
                </IconButton>
              </Tooltip>
            ))}
          </Paper>
        </BubbleMenu>
      )}

      {!readOnly && editor !== null && (
        <FloatingMenu
          editor={editor}
          shouldShow={({ state }) => {
            const { $anchor, empty } = state.selection;
            if (!empty) return false;
            const isTextblock = $anchor.parent.isTextblock && !$anchor.parent.type.spec.code;
            return isTextblock && $anchor.parent.textContent === "/";
          }}
        >
          <Paper
            elevation={0}
            sx={(theme) => ({
              py: 1,
              minWidth: 230,
              borderRadius: "10px",
              border: "1px solid",
              borderColor: "divider",
              backdropFilter: "blur(16px)",
              bgcolor: "rgba(255,255,255,0.96)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              ...theme.applyStyles("dark", {
                backgroundColor: "rgba(28,28,28,0.92)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              }),
            })}
          >
            {blockGroups.map((group, gi) => (
              <Box key={group.label}>
                {gi > 0 && <Divider sx={{ my: 0.75, mx: 1.5 }} />}
                <Typography
                  sx={{
                    px: 2,
                    pb: 0.375,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "text.disabled",
                  }}
                >
                  {group.label}
                </Typography>
                {group.items.map(({ label, hint, Icon, cmd }) => (
                  <Box
                    key={label}
                    onClick={() => editor && cmd(editor)}
                    sx={{
                      px: 2,
                      py: 0.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      cursor: "pointer",
                      transition: "background 0.08s",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 16, flexShrink: 0 }}>
                      <Icon sx={{ fontSize: 14, color: "text.secondary" }} />
                    </Box>
                    <Typography sx={{ fontSize: "0.825rem", fontWeight: 500, flex: 1 }}>{label}</Typography>
                    <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.7rem" }}>{hint}</Typography>
                  </Box>
                ))}
              </Box>
            ))}
          </Paper>
        </FloatingMenu>
      )}

      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        style={{ display: "none" }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file || !editor) return;
          try {
            const url = await uploadImage(file);
            editor.chain().focus().setImage({ src: url }).run();
          } catch (err) {
            console.error(err);
          }
        }}
      />

      <AIPanel
        open={aiOpen}
        anchor={aiAnchor}
        mode={aiMode}
        selection={aiSelection}
        context={aiContext}
        onReplace={handleAIReplace}
        onInsertBelow={handleAIInsertBelow}
        onClose={() => setAiOpen(false)}
      />

      <CommentComposer
        open={commentOpen}
        anchor={commentAnchor}
        snippet={commentSnippet}
        authorName={user?.name}
        onSubmit={submitComment}
        onClose={() => setCommentOpen(false)}
      />
    </Box>
  );
}
