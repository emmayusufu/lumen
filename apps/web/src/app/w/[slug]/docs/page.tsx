"use client";

import { use, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { fetchDocs, createDocInWorkspace } from "@/lib/api";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function WorkspaceDocsPage({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const docs = await fetchDocs(slug);
        if (docs.length > 0) {
          router.replace(`/w/${slug}/docs/${docs[0].id}`);
          return;
        }
      } catch (err) {
        console.error("failed to list docs for workspace", slug, err);
      }
      try {
        const { id } = await createDocInWorkspace(slug);
        router.replace(`/w/${slug}/docs/${id}`);
      } catch (err) {
        console.error("failed to create first doc for workspace", slug, err);
      }
    })();
  }, [slug, router]);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <CircularProgress />
    </Box>
  );
}
