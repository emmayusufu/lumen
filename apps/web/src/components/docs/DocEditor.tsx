"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import type { Editor } from "@tiptap/react";

interface DocEditorProps {
  content: string;
  readOnly: boolean;
  onContentSave: (content: string) => void;
  onAskAI?: () => void;
}

// Delete the '/' that triggered the menu, then apply the block type
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
    fontSize: "1rem",
    lineHeight: 1.8,
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
    "& h1": { fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.2, mt: "1.5em", mb: "0.25em" },
    "& h2": { fontSize: "1.375rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.3, mt: "1.25em", mb: "0.25em" },
    "& h3": { fontSize: "1.125rem", fontWeight: 700, letterSpacing: "-0.01em", mt: "1em", mb: "0.25em" },
    "& pre": {
      bgcolor: (t: { palette: { mode: string } }) => t.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
      borderRadius: "6px",
      p: 2,
      fontFamily: "'SF Mono', 'Fira Code', monospace",
      fontSize: "0.85rem",
      overflowX: "auto",
      my: 1.5,
      border: "1px solid",
      borderColor: "divider",
    },
    "& code": {
      fontFamily: "'SF Mono', 'Fira Code', monospace",
      fontSize: "0.82em",
      bgcolor: (t: { palette: { mode: string } }) => t.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      borderRadius: "4px",
      px: 0.625,
      py: 0.125,
    },
    "& blockquote": {
      borderLeft: "3px solid",
      borderColor: "primary.light",
      pl: 2.5,
      color: "text.secondary",
      my: 1.5,
      ml: 0,
      fontStyle: "italic",
    },
    "& ul, & ol": { pl: 2.5 },
    "& li + li": { mt: 0.375 },
    "& p": { my: 0.625 },
    "& p:first-of-type": { mt: 0 },
  },
};

const FORMATS = [
  { Icon: FormatBoldIcon, mark: "bold", fn: (e: Editor) => e.chain().focus().toggleBold().run() },
  { Icon: FormatItalicIcon, mark: "italic", fn: (e: Editor) => e.chain().focus().toggleItalic().run() },
  { Icon: FormatStrikethroughIcon, mark: "strike", fn: (e: Editor) => e.chain().focus().toggleStrike().run() },
  { Icon: CodeRoundedIcon, mark: "code", fn: (e: Editor) => e.chain().focus().toggleCode().run() },
];

const BLOCK_GROUPS: {
  label: string;
  items: { label: string; hint: string; Icon: React.ElementType; cmd: (e: Editor) => void }[];
}[] = [
  {
    label: "Text",
    items: [
      { label: "Text", hint: "Plain paragraph", Icon: NotesRoundedIcon, cmd: withSlashDelete((e) => e.chain().focus().setParagraph().run()) },
      { label: "Heading 1", hint: "Big title", Icon: () => <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, lineHeight: 1, color: "text.secondary", minWidth: 14 }}>H1</Typography>, cmd: withSlashDelete((e) => e.chain().focus().setHeading({ level: 1 }).run()) },
      { label: "Heading 2", hint: "Section title", Icon: () => <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, lineHeight: 1, color: "text.secondary", minWidth: 14 }}>H2</Typography>, cmd: withSlashDelete((e) => e.chain().focus().setHeading({ level: 2 }).run()) },
      { label: "Heading 3", hint: "Sub-section", Icon: () => <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, lineHeight: 1, color: "text.secondary", minWidth: 14 }}>H3</Typography>, cmd: withSlashDelete((e) => e.chain().focus().setHeading({ level: 3 }).run()) },
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

export function DocEditor({ content, readOnly, onContentSave, onAskAI }: DocEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing, or type '/' for commands…", showOnlyCurrent: true }),
    ],
    content,
    editable: !readOnly,
    immediatelyRender: false,
    onBlur: ({ editor: e }) => onContentSave(e.getHTML()),
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === content) return;
    editor.commands.setContent(content, false as never);
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!onAskAI) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); onAskAI(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onAskAI]);

  return (
    <Box sx={editorSx}>
      {/* Glassmorphic bubble menu — only mount once editor is ready */}
      {editor !== null && <BubbleMenu editor={editor}>
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            p: 0.5,
            gap: 0.25,
            borderRadius: "9px",
            border: "1px solid",
            borderColor: "divider",
            backdropFilter: "blur(16px)",
            bgcolor: (t) =>
              t.palette.mode === "dark" ? "rgba(28,28,28,0.88)" : "rgba(255,255,255,0.92)",
            boxShadow: (t) =>
              t.palette.mode === "dark"
                ? "0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset"
                : "0 4px 24px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.8) inset",
          }}
        >
          {FORMATS.map(({ Icon, mark, fn }) => (
            <IconButton
              key={mark}
              size="small"
              onClick={() => editor && fn(editor)}
              sx={{
                p: 0.625,
                borderRadius: "6px",
                color: editor?.isActive(mark) ? "primary.main" : "text.secondary",
                bgcolor: editor?.isActive(mark)
                  ? (t) => t.palette.mode === "dark" ? "rgba(186,200,160,0.15)" : "rgba(163,176,135,0.12)"
                  : "transparent",
                "&:hover": { bgcolor: "action.hover" },
                transition: "all 0.1s ease",
              }}
            >
              <Icon sx={{ fontSize: 14 }} />
            </IconButton>
          ))}
        </Paper>
      </BubbleMenu>}

      {/* Slash-command menu — only mount once editor is ready, only shows on '/' */}
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
            sx={{
              py: 1,
              minWidth: 230,
              borderRadius: "10px",
              border: "1px solid",
              borderColor: "divider",
              backdropFilter: "blur(16px)",
              bgcolor: (t) =>
                t.palette.mode === "dark" ? "rgba(28,28,28,0.92)" : "rgba(255,255,255,0.96)",
              boxShadow: (t) =>
                t.palette.mode === "dark"
                  ? "0 12px 40px rgba(0,0,0,0.5)"
                  : "0 8px 32px rgba(0,0,0,0.1)",
            }}
          >
            {BLOCK_GROUPS.map((group, gi) => (
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
    </Box>
  );
}
