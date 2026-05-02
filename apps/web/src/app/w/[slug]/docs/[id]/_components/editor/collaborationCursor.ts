import { Extension } from "@tiptap/core";
import { yCursorPlugin } from "@tiptap/y-tiptap";
import type { HocuspocusProvider } from "@hocuspocus/provider";

const CURSOR_COLORS = [
  "#8B9B6E",
  "#B8804A",
  "#6E8B9B",
  "#9B6E8B",
  "#6E9B8B",
  "#9B8B6E",
];

export function cursorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++)
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

export const CollaborationCursorExt = Extension.create<{
  provider: HocuspocusProvider | null;
  user: { name: string; color: string } | null;
}>({
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
