"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import type { ResearchResult } from "@/lib/types";
import { ReportSection } from "./ReportSection";
import { SourceList } from "./SourceList";

interface ReportViewProps {
  content: string;
  sources: ResearchResult[];
  onSwitchToChat: () => void;
}

export function ReportView({
  content,
  sources,
  onSwitchToChat,
}: ReportViewProps) {
  const sections = parseReportSections(content);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Research Report</Typography>
        <Button size="small" onClick={onSwitchToChat}>
          Switch to Chat
        </Button>
      </Box>
      {sections.map((section, index) => (
        <ReportSection
          key={index}
          title={section.title}
          content={section.content}
          defaultExpanded={index === 0}
        />
      ))}
      <SourceList sources={sources} />
    </Box>
  );
}

function parseReportSections(
  content: string,
): Array<{ title: string; content: string }> {
  const lines = content.split("\n");
  const sections: Array<{ title: string; content: string }> = [];
  let currentTitle = "Overview";
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentContent.length > 0) {
        sections.push({
          title: currentTitle,
          content: currentContent.join("\n").trim(),
        });
      }
      currentTitle = line.replace("## ", "").trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentContent.length > 0) {
    sections.push({
      title: currentTitle,
      content: currentContent.join("\n").trim(),
    });
  }

  return sections;
}
