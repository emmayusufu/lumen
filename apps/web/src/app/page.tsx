"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { fetchWorkspaces } from "@/lib/api";
import { Nav } from "./_landing/Nav";
import { Hero } from "./_landing/Hero";
import { Features } from "./_landing/Features";
import { Showcase } from "./_landing/Showcase";
import { CTA } from "./_landing/CTA";
import { Footer } from "./_landing/Footer";

export default function HomePage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [workspaceSlug, setWorkspaceSlug] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspaces()
      .then((ws) => {
        if (ws.length > 0) {
          setAuthed(true);
          setWorkspaceSlug(ws[0].slug);
        } else {
          setAuthed(false);
        }
      })
      .catch(() => setAuthed(false));
  }, []);

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        backgroundColor: "#EEE8D8",
        color: "#2A2520",
        fontFamily: "var(--font-nunito), sans-serif",
        ...theme.applyStyles("dark", {
          backgroundColor: "#121006",
          color: "#EBE6D9",
        }),
      })}
    >
      <Nav authed={authed} workspaceSlug={workspaceSlug} />
      <Hero />
      <Features />
      <Showcase />
      <CTA />
      <Footer />
    </Box>
  );
}
