import type { EditorView } from "@tiptap/pm/view";
import { uploadImage } from "@/lib/api";

function imageFiles(list: FileList | undefined | null): File[] {
  return Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
}

function insertImagesAt(view: EditorView, urls: string[], pos?: number) {
  urls.forEach((url) => {
    const node = view.state.schema.nodes.image.create({ src: url });
    const tr =
      pos !== undefined
        ? view.state.tr.insert(pos, node)
        : view.state.tr.replaceSelectionWith(node);
    view.dispatch(tr);
  });
}

export function handleEditorPaste(view: EditorView, event: ClipboardEvent) {
  const files = imageFiles(event.clipboardData?.files);
  if (files.length === 0) return false;
  event.preventDefault();
  void Promise.all(files.map(uploadImage)).then((urls) =>
    insertImagesAt(view, urls),
  );
  return true;
}

export function handleEditorDrop(view: EditorView, event: DragEvent) {
  const files = imageFiles(event.dataTransfer?.files);
  if (files.length === 0) return false;
  event.preventDefault();
  const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
  const pos = coords?.pos ?? view.state.selection.from;
  void Promise.all(files.map(uploadImage)).then((urls) =>
    insertImagesAt(view, urls, pos),
  );
  return true;
}
