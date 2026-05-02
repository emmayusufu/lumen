import type { Doc } from "@/lib/types";

export interface DocNode {
  doc: Doc;
  children: DocNode[];
}

export function buildDocTree(docs: Doc[]): DocNode[] {
  const ids = new Set(docs.map((d) => d.id));
  const childrenOf = new Map<string | null, DocNode[]>();

  for (const doc of docs) {
    const key = doc.parent_id && ids.has(doc.parent_id) ? doc.parent_id : null;
    const node: DocNode = { doc, children: [] };
    const list = childrenOf.get(key);
    if (list) list.push(node);
    else childrenOf.set(key, [node]);
  }

  const attach = (nodes: DocNode[]) => {
    for (const n of nodes) {
      const kids = childrenOf.get(n.doc.id) ?? [];
      kids.sort(byCreatedThenTitle);
      n.children = kids;
      attach(kids);
    }
  };

  const roots = childrenOf.get(null) ?? [];
  roots.sort(byCreatedThenTitle);
  attach(roots);
  return roots;
}

function byCreatedThenTitle(a: DocNode, b: DocNode): number {
  return (
    a.doc.updated_at.localeCompare(b.doc.updated_at) * -1 ||
    a.doc.title.localeCompare(b.doc.title)
  );
}

export function ancestorIds(docs: Doc[], id: string): string[] {
  const byId = new Map(docs.map((d) => [d.id, d]));
  const out: string[] = [];
  let cursor = byId.get(id)?.parent_id ?? null;
  while (cursor) {
    out.push(cursor);
    cursor = byId.get(cursor)?.parent_id ?? null;
  }
  return out;
}
