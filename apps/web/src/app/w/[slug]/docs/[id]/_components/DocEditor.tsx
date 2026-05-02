"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import Box from "@mui/material/Box";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { AIPanel } from "./ai/AIPanel";
import { CommentComposer } from "./CommentComposer";
import { editorSx } from "./editor/editorSx";
import { buildExtensions } from "./editor/buildExtensions";
import {
  handleEditorDrop,
  handleEditorPaste,
} from "./editor/imageDropHandlers";
import {
  factCheckPluginKey,
  getVerdictAtElement,
  type FactCheckVerdict,
} from "./editor/factCheckDecorations";
import { FactCheckTooltip } from "./editor/FactCheckTooltip";
import {
  BASE_BLOCK_GROUPS,
  withSlashDelete,
  type BlockGroup,
} from "./editor/blockMenu";
import { TextBubbleMenu } from "./editor/TextBubbleMenu";
import { TableBubbleMenu } from "./editor/TableBubbleMenu";
import { SlashMenu } from "./editor/SlashMenu";
import { uploadImage } from "@/lib/api";
import {
  extractCursorContext,
  extractSelectionContext,
} from "./editor-context";
import { looksLikeMarkdown, markdownToHtml } from "./markdown";

interface DocEditorProps {
  content: string;
  readOnly: boolean;
  user?: { id: string; name: string };
  provider: HocuspocusProvider | null;
  synced: boolean;
  onContentSave: (content: string) => void;
  onContentChange?: (content: string) => void;
  onCreateComment?: (threadId: string, body: string) => Promise<void>;
  onOpenThread?: (threadId: string) => void;
  threadIds?: string[];
  resolvedThreadIds?: string[];
  factCheckHighlights?: FactCheckVerdict[] | null;
}

export function DocEditor({
  content,
  readOnly,
  user,
  provider,
  synced,
  onContentSave,
  onContentChange,
  onCreateComment,
  onOpenThread,
  threadIds,
  resolvedThreadIds,
  factCheckHighlights,
}: DocEditorProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string>(content);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openFileDialog = useCallback(() => fileInputRef.current?.click(), []);
  const [aiAnchor, setAiAnchor] = useState<{
    nodeType: 1;
    getBoundingClientRect: () => DOMRect;
  } | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState<"selection" | "generate">("selection");
  const [aiSelection, setAiSelection] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [aiRange, setAiRange] = useState<{ from: number; to: number } | null>(
    null,
  );
  const [commentAnchor, setCommentAnchor] = useState<{
    nodeType: 1;
    getBoundingClientRect: () => DOMRect;
  } | null>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentSnippet, setCommentSnippet] = useState("");
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null);
  const [pendingRange, setPendingRange] = useState<{
    from: number;
    to: number;
  } | null>(null);

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

  const editor = useEditor(
    {
      extensions: buildExtensions({ provider, user: user ?? null }),
      content: provider ? undefined : content,
      editable: !readOnly,
      immediatelyRender: false,
      editorProps: {
        handlePaste: (view, event) => handleEditorPaste(view, event),
        handleDrop: (view, event) => handleEditorDrop(view, event as DragEvent),
      },
      onUpdate: ({ editor: e }) => {
        const html = e.getHTML();
        onContentChange?.(html);
        scheduleSave(html);
      },
      onBlur: ({ editor: e }) => flushSave(e.getHTML()),
    },
    [provider],
  );

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

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

  const [tooltipVerdict, setTooltipVerdict] = useState<FactCheckVerdict | null>(
    null,
  );
  const [tooltipAnchor, setTooltipAnchor] = useState<DOMRect | null>(null);
  const [tooltipContainer, setTooltipContainer] = useState<DOMRect | null>(
    null,
  );
  const editorWrapRef = useRef<HTMLDivElement | null>(null);
  const tooltipHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editor) return;
    const tr = editor.view.state.tr.setMeta(
      factCheckPluginKey,
      factCheckHighlights ?? null,
    );
    editor.view.dispatch(tr);
  }, [editor, factCheckHighlights]);

  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom as HTMLElement;
    const showTip = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest("[data-fci]") as HTMLElement | null;
      if (!mark) return;
      if (tooltipHideTimer.current) clearTimeout(tooltipHideTimer.current);
      const pluginState = factCheckPluginKey.getState(editor.view.state);
      const verdict = getVerdictAtElement(mark, pluginState ?? undefined);
      if (!verdict) return;
      setTooltipVerdict(verdict);
      setTooltipAnchor(mark.getBoundingClientRect());
      setTooltipContainer(
        editorWrapRef.current?.getBoundingClientRect() ?? null,
      );
    };
    const hideTip = () => {
      tooltipHideTimer.current = setTimeout(() => {
        setTooltipVerdict(null);
        setTooltipAnchor(null);
        setTooltipContainer(null);
      }, 120);
    };
    el.addEventListener("mouseover", showTip);
    el.addEventListener("mouseleave", hideTip);
    return () => {
      el.removeEventListener("mouseover", showTip);
      el.removeEventListener("mouseleave", hideTip);
    };
  }, [editor]);

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
          if (
            m.type.name === "comment" &&
            tid &&
            !active.has(tid) &&
            !stale.includes(tid)
          ) {
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

  const resolvedSetRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    resolvedSetRef.current = new Set(resolvedThreadIds);
  }, [resolvedThreadIds]);

  useEffect(() => {
    if (!editor || !onOpenThread) return;
    let dom: Element | null = null;
    const click = (e: Event) => {
      const target = e.target as HTMLElement;
      const el = target.closest(".lumen-comment") as HTMLElement | null;
      const threadId = el?.getAttribute("data-thread-id");
      if (!threadId) return;
      if (resolvedSetRef.current.has(threadId)) return;
      e.preventDefault();
      onOpenThread(threadId);
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
    if (!editor || !pendingThreadId || !pendingRange || !onCreateComment)
      return;
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

  const toInsertable = (text: string): string =>
    looksLikeMarkdown(text) ? markdownToHtml(text) : text;

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
            cmd: withSlashDelete(openFileDialog),
          },
        ],
      },
    ],
    [editor],
  );

  const resolvedHighlightCss = useMemo(() => {
    if (!resolvedThreadIds || resolvedThreadIds.length === 0) return "";
    const base = resolvedThreadIds
      .map((id) => `.lumen-doc-editor [data-thread-id="${id}"]`)
      .join(", ");
    const hover = resolvedThreadIds
      .map((id) => `.lumen-doc-editor [data-thread-id="${id}"]:hover`)
      .join(", ");
    return `
      ${base} { background-color: transparent !important; border-bottom: none !important; cursor: text !important; }
      ${hover} { background-color: transparent !important; }
    `;
  }, [resolvedThreadIds]);

  return (
    <Box
      ref={editorWrapRef}
      className="lumen-doc-editor"
      sx={{ ...editorSx, position: "relative" }}
    >
      {resolvedHighlightCss && <style>{resolvedHighlightCss}</style>}
      {editor && (
        <TextBubbleMenu
          editor={editor}
          onAskAI={openAIFromSelection}
          onComment={onCreateComment ? openCommentComposer : undefined}
        />
      )}
      {editor && !readOnly && <TableBubbleMenu editor={editor} />}
      {editor && !readOnly && (
        <SlashMenu editor={editor} blockGroups={blockGroups} />
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

      {tooltipVerdict && tooltipAnchor && tooltipContainer && (
        <FactCheckTooltip
          verdict={tooltipVerdict}
          anchorRect={tooltipAnchor}
          containerRect={tooltipContainer}
          onClose={() => {
            setTooltipVerdict(null);
            setTooltipAnchor(null);
            setTooltipContainer(null);
          }}
        />
      )}
    </Box>
  );
}
