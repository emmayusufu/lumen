"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchDoc } from "@/lib/api";

interface Props {
  params: Promise<{ id: string }>;
}

export default function LegacyDocPage({ params }: Props) {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const { id } = await params;
      try {
        const doc = await fetchDoc(id);
        router.replace(`/w/${doc.workspace_slug}/docs/${id}`);
      } catch {
        router.replace("/");
      }
    })();
  }, [params, router]);
  return null;
}
