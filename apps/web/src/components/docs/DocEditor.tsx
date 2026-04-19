"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { createLowlight, common } from "lowlight";
import { CodeBlock } from "./CodeBlock";
import { AIPanel } from "./ai/AIPanel";
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
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import type { Editor } from "@tiptap/react";
import { extractCursorContext, extractSelectionContext } from "@/lib/editor-context";
import { looksLikeMarkdown, markdownToHtml } from "@/lib/markdown";

const COLLAB_URL = process.env.NEXT_PUBLIC_COLLAB_URL ?? "ws://localhost:1234";

interface DocEditorProps {
  docId: string;
  content: string;
  readOnly: boolean;
  onContentSave: (content: string) => void;
  onContentChange?: (content: string) => void;
  onAskAI?: () => void;
}

const withSlashDelete = (fn: (e: Editor) => void) => (e: Editor) => {
  const { $anchor } = e.state.selection;
  if ($anchor.parent.textContent === "/") {
    e.chain().deleteRange({ from: $anchor.pos - 1, to: $anchor.pos }).run();
  }
  fn(e);
};

const editorSx = {
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

export function DocEditor({ docId, content, readOnly, onContentSave, onContentChange, onAskAI }: DocEditorProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string>(content);
  const [wsToken, setWsToken] = useState<string | null>(null);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [synced, setSynced] = useState(false);
  const [aiAnchor, setAiAnchor] = useState<{ nodeType: 1; getBoundingClientRect: () => DOMRect } | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState<"selection" | "generate">("selection");
  const [aiSelection, setAiSelection] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [aiRange, setAiRange] = useState<{ from: number; to: number } | null>(null);

  useEffect(() => {
    fetch("/api/backend/api/v1/auth/ws-token")
      .then((r) => r.json())
      .then((d: { token: string }) => setWsToken(d.token))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!wsToken) return;
    const p = new HocuspocusProvider({
      url: COLLAB_URL,
      name: docId,
      token: wsToken,
      onSynced: () => setSynced(true),
    });
    setProvider(p);
    return () => { p.destroy(); setProvider(null); setSynced(false); };
  }, [wsToken, docId]);

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
      ...(provider ? [
        Collaboration.configure({ document: provider.document }),
      ] : []),
    ],
    content: provider ? undefined : content,
    editable: !readOnly,
    immediatelyRender: false,
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
    ],
    [editor],
  );

  return (
    <Box sx={editorSx}>
      {editor !== null && <BubbleMenu editor={editor}>
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
        </Paper>
      </BubbleMenu>}

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
    </Box>
  );
}
