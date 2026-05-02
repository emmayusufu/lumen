import { Extension } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface FactCheckVerdict {
  index: number;
  quote: string;
  claim: string;
  status: "confirmed" | "disputed" | "inconclusive" | "checking";
  summary: string;
  sources: Array<{ title: string; url: string; snippet: string }>;
}

interface PluginState {
  decos: DecorationSet;
  verdicts: Map<number, FactCheckVerdict>;
}

export const factCheckPluginKey = new PluginKey<PluginState>(
  "factCheckDecorations",
);

const BG: Record<string, string> = {
  confirmed: "rgba(34,197,94,0.18)",
  disputed: "rgba(239,68,68,0.18)",
  inconclusive: "rgba(234,179,8,0.18)",
  checking: "rgba(148,163,184,0.12)",
};
const BORDER: Record<string, string> = {
  confirmed: "#22c55e",
  disputed: "#ef4444",
  inconclusive: "#eab308",
  checking: "#94a3b8",
};

function findQuote(
  doc: PMNode,
  quote: string,
): { from: number; to: number } | null {
  const needle = quote.trim();
  if (!needle) return null;
  const lower = needle.toLowerCase();

  const chunks: { text: string; pos: number }[] = [];
  doc.descendants((node, pos) => {
    if (node.isText) chunks.push({ text: node.text!, pos });
  });

  const full = chunks
    .map((c) => c.text)
    .join("")
    .toLowerCase();
  const idx = full.indexOf(lower);
  if (idx < 0) return null;

  const mapChar = (ci: number): number => {
    let count = 0;
    for (const chunk of chunks) {
      const end = count + chunk.text.length;
      if (ci <= end) return chunk.pos + (ci - count);
      count = end;
    }
    return -1;
  };

  const from = mapChar(idx);
  const to = mapChar(idx + lower.length);
  if (from < 0 || to < 0) return null;
  return { from, to };
}

function buildState(doc: PMNode, verdicts: FactCheckVerdict[]): PluginState {
  const map = new Map<number, FactCheckVerdict>();
  const decos: Decoration[] = [];

  for (const v of verdicts) {
    map.set(v.index, v);
    const range = findQuote(doc, v.quote);
    if (!range) continue;
    decos.push(
      Decoration.inline(range.from, range.to, {
        style: `background:${BG[v.status] ?? BG.checking};border-bottom:2px solid ${BORDER[v.status] ?? BORDER.checking};border-radius:2px;cursor:pointer;`,
        class: `fact-check-hl fact-check-${v.status}`,
        "data-fci": String(v.index),
      }),
    );
  }

  return { decos: DecorationSet.create(doc, decos), verdicts: map };
}

export const FactCheckDecorations = Extension.create({
  name: "factCheckDecorations",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: factCheckPluginKey,
        state: {
          init: () => ({
            decos: DecorationSet.empty,
            verdicts: new Map(),
          }),
          apply(tr, prev) {
            const meta = tr.getMeta(factCheckPluginKey) as
              | FactCheckVerdict[]
              | null
              | undefined;
            if (meta === null)
              return { decos: DecorationSet.empty, verdicts: new Map() };
            if (meta !== undefined) return buildState(tr.doc, meta);
            return {
              decos: prev.decos.map(tr.mapping, tr.doc),
              verdicts: prev.verdicts,
            };
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)?.decos;
          },
        },
      }),
    ];
  },
});

export function getVerdictAtElement(
  el: HTMLElement,
  editorState: ReturnType<typeof factCheckPluginKey.getState>,
): FactCheckVerdict | null {
  const mark = el.closest("[data-fci]") as HTMLElement | null;
  if (!mark || !editorState) return null;
  const idx = parseInt(mark.dataset.fci ?? "", 10);
  return editorState.verdicts.get(idx) ?? null;
}
