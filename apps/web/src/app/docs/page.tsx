"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWorkspaces } from "@/lib/api";

export default function LegacyDocsIndex() {
  const router = useRouter();
  useEffect(() => {
    fetchWorkspaces()
      .then((ws) => {
        if (ws.length > 0) router.replace(`/w/${ws[0].slug}/docs`);
        else router.replace("/");
      })
      .catch(() => router.replace("/login"));
  }, [router]);
  return null;
}
