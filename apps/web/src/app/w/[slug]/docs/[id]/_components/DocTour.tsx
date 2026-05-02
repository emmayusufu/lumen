"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useTour } from "./useTour";

interface Props {
  autoStart?: boolean;
}

const STEPS = [
  {
    element: "#tour-workspace-switcher",
    popover: {
      title: "Your workspace",
      description:
        "Switch between workspaces or create a new one here. Invite teammates from Workspace settings.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: "#tour-doc-title",
    popover: {
      title: "Give this doc a name",
      description:
        "Click the title and start typing. It auto-saves as you go — no save button needed.",
      side: "bottom" as const,
      align: "start" as const,
    },
  },
  {
    element: "#tour-editor",
    popover: {
      title: "Write here",
      description:
        "Start typing anywhere. Type / to open the slash command menu — headings, tables, code blocks, images, and AI commands.",
      side: "top" as const,
      align: "start" as const,
    },
  },
  {
    element: "#tour-doc-menu",
    popover: {
      title: "More actions",
      description:
        "Summarize the doc with AI, fact-check your claims against the web, or export as Markdown or PDF.",
      side: "bottom" as const,
      align: "end" as const,
    },
  },
  {
    element: "#tour-share",
    popover: {
      title: "Share with others",
      description:
        "Invite collaborators as editor or viewer. You can also open a doc to everyone in your workspace.",
      side: "bottom" as const,
      align: "end" as const,
    },
  },
  {
    element: "#tour-comments",
    popover: {
      title: "Threaded comments",
      description:
        "Select any passage in the doc and click the comment bubble to leave a note. Threads can be resolved when done.",
      side: "bottom" as const,
      align: "end" as const,
    },
  },
];

export function DocTour({ autoStart = false }: Props) {
  const { isDone, markDone } = useTour();

  useEffect(() => {
    if (!autoStart || isDone()) return;

    const timeout = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        progressText: "{{current}} of {{total}}",
        nextBtnText: "Next →",
        prevBtnText: "← Back",
        doneBtnText: "Done",
        allowClose: true,
        overlayOpacity: 0.55,
        popoverClass: "lumen-tour-popover",
        onDestroyed: () => markDone(),
        steps: STEPS,
      });
      driverObj.drive();
    }, 800);

    return () => clearTimeout(timeout);
  }, [autoStart, isDone, markDone]);

  return null;
}
