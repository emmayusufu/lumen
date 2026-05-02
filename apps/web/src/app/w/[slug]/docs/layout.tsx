"use client";

import { use, useCallback, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import { DocSidebar } from "./[id]/_components/DocSidebar";
import { useDocs } from "./[id]/_components/useDocs";
import { DocShellContext } from "./_components/DocShellContext";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export default function DocsShellLayout({ params, children }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  const pathname = usePathname();

  const currentId = useMemo(() => {
    const m = pathname?.match(/\/w\/[^/]+\/docs\/([^/]+)/);
    return m?.[1] ?? "";
  }, [pathname]);

  const {
    docs,
    createDoc,
    removeDoc,
    moveDoc: moveDocAction,
    refresh: refreshDocs,
  } = useDocs(slug);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  const pendingDeleteDoc = pendingDeleteId
    ? docs.find((d) => d.id === pendingDeleteId)
    : undefined;
  const pendingDeleteHasChildren = Boolean(
    pendingDeleteId && docs.some((d) => d.parent_id === pendingDeleteId),
  );

  const handleCreate = async (parentId: string | null = null) => {
    if (creating) return;
    setCreating(true);
    try {
      const { id: newId } = await createDoc("Untitled", parentId);
      router.push(`/w/${slug}/docs/${newId}`);
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    const docId = pendingDeleteId;
    setDeleting(true);
    try {
      await removeDoc(docId);
      if (docId === currentId) {
        const fallback = docs.find((d) => d.id !== docId);
        if (fallback) router.push(`/w/${slug}/docs/${fallback.id}`);
        else router.push(`/w/${slug}/docs`);
      }
    } finally {
      setDeleting(false);
      setPendingDeleteId(null);
    }
  };

  const handleMove = async (docId: string, parentId: string | null) => {
    try {
      await moveDocAction(docId, parentId);
    } catch (err) {
      setMoveError((err as Error).message);
    }
  };

  const shell = useMemo(
    () => ({
      openSidebar: () => setSidebarOpen(true),
      refreshDocs,
    }),
    [refreshDocs],
  );

  const openDelete = useCallback((id: string) => setPendingDeleteId(id), []);

  return (
    <DocShellContext.Provider value={shell}>
      <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <DocSidebar
          docs={docs}
          currentId={currentId}
          workspaceSlug={slug}
          creating={creating}
          onCreate={handleCreate}
          onMove={handleMove}
          onDelete={openDelete}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />
        {children}
      </Box>

      <Snackbar
        open={!!moveError}
        message={moveError}
        autoHideDuration={4000}
        onClose={() => setMoveError(null)}
      />

      <Dialog
        open={Boolean(pendingDeleteId)}
        onClose={() => !deleting && setPendingDeleteId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Delete page?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.92rem" }}>
            <Box component="span" sx={{ fontWeight: 600 }}>
              {pendingDeleteDoc?.title || "Untitled"}
            </Box>{" "}
            {pendingDeleteHasChildren
              ? "and all of its subpages will be permanently deleted. This cannot be undone."
              : "will be permanently deleted. This cannot be undone."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setPendingDeleteId(null)}
            disabled={deleting}
            variant="outlined"
            color="error"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            sx={{ boxShadow: "none", "&:hover": { boxShadow: "none" } }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </DocShellContext.Provider>
  );
}
