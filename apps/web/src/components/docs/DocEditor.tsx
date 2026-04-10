"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import CodeIcon from "@mui/icons-material/Code";
import type { Editor } from "@tiptap/react";

interface DocEditorProps {
  content: string;
  readOnly: boolean;
  onContentSave: (content: string) => void;
  onAskAI?: () => void;
}

const editorSx = {
  "& .ProseMirror": {
    outline: "none",
    minHeight: "60vh",
    fontSize: "1rem",
    lineHeight: 1.75,
    color: "text.primary",
    "& .is-empty::before": {
      content: "attr(data-placeholder)",
      float: "left",
      color: "text.disabled",
      pointerEvents: "none",
      height: 0,
    },
    "& h1": { fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em", mt: 3, mb: 0.25 },
    "& h2": { fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.01em", mt: 2.5, mb: 0.25 },
    "& h3": { fontSize: "1.25rem", fontWeight: 600, mt: 2, mb: 0.25 },
    "& pre": { bgcolor: "action.hover", borderRadius: "4px", p: 2, fontFamily: "monospace", fontSize: "0.875rem", overflowX: "auto", my: 1 },
    "& code": { fontFamily: "monospace", fontSize: "0.85em", bgcolor: "action.hover", borderRadius: "3px", px: 0.5 },
    "& blockquote": { borderLeft: "3px solid", borderColor: "divider", pl: 2, color: "text.secondary", my: 1, ml: 0 },
    "& ul, & ol": { pl: 3 },
    "& li + li": { mt: 0.25 },
    "& p": { my: 0.5 },
  },
};

const FORMATS = [
  { Icon: FormatBoldIcon, mark: "bold", fn: (e: Editor) => e.chain().focus().toggleBold().run() },
  { Icon: FormatItalicIcon, mark: "italic", fn: (e: Editor) => e.chain().focus().toggleItalic().run() },
  { Icon: FormatStrikethroughIcon, mark: "strike", fn: (e: Editor) => e.chain().focus().toggleStrike().run() },
  { Icon: CodeIcon, mark: "code", fn: (e: Editor) => e.chain().focus().toggleCode().run() },
];

const BLOCKS: { label: string; hint: string; cmd: (e: Editor) => void }[] = [
  { label: "Text", hint: "Plain paragraph", cmd: (e) => e.chain().focus().setParagraph().run() },
  { label: "Heading 1", hint: "Large title", cmd: (e) => e.chain().focus().setHeading({ level: 1 }).run() },
  { label: "Heading 2", hint: "Medium title", cmd: (e) => e.chain().focus().setHeading({ level: 2 }).run() },
  { label: "Heading 3", hint: "Small title", cmd: (e) => e.chain().focus().setHeading({ level: 3 }).run() },
  { label: "Bullet list", hint: "Unordered list", cmd: (e) => e.chain().focus().toggleBulletList().run() },
  { label: "Numbered list", hint: "Ordered list", cmd: (e) => e.chain().focus().toggleOrderedList().run() },
  { label: "Code block", hint: "Monospace code", cmd: (e) => e.chain().focus().toggleCodeBlock().run() },
  { label: "Quote", hint: "Callout text", cmd: (e) => e.chain().focus().toggleBlockquote().run() },
];

export function DocEditor({ content, readOnly, onContentSave, onAskAI }: DocEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Type '/' for commands…", showOnlyCurrent: true }),
    ],
    content,
    editable: !readOnly,
    immediatelyRender: false,
    onBlur: ({ editor: e }) => onContentSave(e.getHTML()),
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === content) return;
    editor.commands.setContent(content, false);
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
      <BubbleMenu editor={editor}>
        <Paper elevation={4} sx={{ display: "flex", p: 0.5, gap: 0.25, borderRadius: "8px", border: 1, borderColor: "divider" }}>
          {FORMATS.map(({ Icon, mark, fn }) => (
            <IconButton key={mark} size="small" onClick={() => editor && fn(editor)}
              sx={{ p: 0.5, borderRadius: "5px", bgcolor: editor?.isActive(mark) ? "action.selected" : "transparent" }}>
              <Icon sx={{ fontSize: 15 }} />
            </IconButton>
          ))}
        </Paper>
      </BubbleMenu>

      {!readOnly && (
        <FloatingMenu editor={editor}>
          <Paper elevation={4} sx={{ py: 0.75, minWidth: 220, borderRadius: "8px", border: 1, borderColor: "divider" }}>
            {BLOCKS.map(({ label, hint, cmd }) => (
              <Box
                key={label}
                onClick={() => editor && cmd(editor)}
                sx={{
                  px: 2,
                  py: 0.625,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Typography sx={{ fontSize: "0.875rem" }}>{label}</Typography>
                <Typography variant="caption" color="text.disabled">{hint}</Typography>
              </Box>
            ))}
          </Paper>
        </FloatingMenu>
      )}

      <EditorContent editor={editor} />
    </Box>
  );
}
