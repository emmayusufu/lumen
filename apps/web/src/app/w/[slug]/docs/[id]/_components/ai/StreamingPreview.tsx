"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { looksLikeMarkdown, markdownToHtml } from "../markdown";

type Stage = "writing" | "refining" | "idle";

interface Props {
  text: string;
  stage: Stage;
}

const STAGE_LABEL: Record<Stage, string> = {
  writing: "Writing…",
  refining: "Refining…",
  idle: "",
};

export function StreamingPreview({ text, stage }: Props) {
  const html = useMemo(
    () => (looksLikeMarkdown(text) ? markdownToHtml(text) : null),
    [text],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1.5 }}>
      {stage !== "idle" && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.875 }}>
          <CircularProgress
            size={11}
            thickness={4}
            sx={{ color: "primary.main" }}
          />
          <Typography
            sx={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.02em",
              color: "text.secondary",
              opacity: 0.85,
            }}
          >
            {STAGE_LABEL[stage]}
          </Typography>
        </Box>
      )}
      {text && (
        <Box
          sx={(theme) => ({
            px: 1.25,
            py: 1,
            borderRadius: "6px",
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "rgba(139, 155, 110, 0.05)",
            fontSize: "0.82rem",
            lineHeight: 1.6,
            color: "text.primary",
            maxHeight: 320,
            overflowY: "auto",
            "& h1, & h2, & h3, & h4": {
              fontSize: "0.92rem",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              mt: 1.25,
              mb: 0.5,
              "&:first-of-type": { mt: 0 },
            },
            "& p": { my: 0.5 },
            "& p:first-of-type": { mt: 0 },
            "& p:last-of-type": { mb: 0 },
            "& ul, & ol": { pl: 2.25, my: 0.5 },
            "& li": { my: 0.125 },
            "& code": {
              fontFamily: "'SF Mono', 'JetBrains Mono', Menlo, monospace",
              fontSize: "0.78rem",
              px: 0.5,
              py: 0.125,
              borderRadius: "3px",
              backgroundColor: "rgba(139, 155, 110, 0.14)",
            },
            "& pre": {
              fontFamily: "'SF Mono', 'JetBrains Mono', Menlo, monospace",
              fontSize: "0.78rem",
              p: 1,
              my: 0.75,
              borderRadius: "4px",
              backgroundColor: "rgba(42, 37, 32, 0.06)",
              overflowX: "auto",
            },
            "& strong": { fontWeight: 700 },
            "& em": { fontStyle: "italic" },
            ...theme.applyStyles("dark", {
              backgroundColor: "rgba(186, 200, 160, 0.06)",
              "& code": { backgroundColor: "rgba(186, 200, 160, 0.14)" },
              "& pre": { backgroundColor: "rgba(235, 230, 217, 0.06)" },
            }),
          })}
        >
          {html ? (
            <div dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <Box component="div" sx={{ whiteSpace: "pre-wrap" }}>
              {text}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
