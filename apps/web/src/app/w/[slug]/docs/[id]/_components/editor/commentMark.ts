import { Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    comment: {
      setComment: (threadId: string) => ReturnType;
      unsetComment: (threadId: string) => ReturnType;
    };
  }
}

export const CommentMark = Mark.create({
  name: "comment",
  inclusive: false,
  exitable: true,

  addAttributes() {
    return {
      threadId: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-thread-id"),
        renderHTML: (attrs) =>
          attrs.threadId ? { "data-thread-id": attrs.threadId } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-thread-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes({ class: "lumen-comment" }, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setComment:
        (threadId: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { threadId }),
      unsetComment:
        (threadId: string) =>
        ({ tr, state, dispatch }) => {
          const { doc } = state;
          const mark = state.schema.marks.comment;
          if (!mark) return false;
          let changed = false;
          doc.descendants((node, pos) => {
            if (!node.isInline) return;
            node.marks.forEach((m) => {
              if (m.type.name === "comment" && m.attrs.threadId === threadId) {
                tr.removeMark(pos, pos + node.nodeSize, m);
                changed = true;
              }
            });
          });
          if (changed && dispatch) dispatch(tr);
          return changed;
        },
    };
  },
});
