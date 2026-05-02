"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      m.default.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "strict",
        fontFamily: "var(--font-nunito), sans-serif",
      });
      return m.default;
    });
  }
  return mermaidPromise;
}

let renderId = 0;

export function MermaidBlock({ node }: NodeViewProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const idRef = useRef(`mermaid-${++renderId}`);
  const source = node.textContent;

  const [editing, setEditing] = useState(() => source.trim().length === 0);

  useEffect(() => {
    let cancelled = false;
    const trimmed = source.trim();
    if (!trimmed) {
      setSvg("");
      setError("");
      return;
    }
    loadMermaid()
      .then(async (mermaid) => {
        try {
          const { svg: rendered } = await mermaid.render(
            idRef.current,
            trimmed,
          );
          if (!cancelled) {
            setSvg(rendered);
            setError("");
          }
        } catch (e) {
          if (!cancelled) {
            const msg = e instanceof Error ? e.message : "Render failed";
            setError(msg);
            setSvg("");
          }
        }
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  const empty = source.trim().length === 0;
  const showEditor = editing || empty || Boolean(error);

  return (
    <NodeViewWrapper as="div" className="lumen-mermaid">
      <Box
        sx={(theme) => ({
          my: 2,
          borderRadius: "10px",
          border: "1px solid rgba(135, 131, 120, 0.22)",
          overflow: "hidden",
          position: "relative",
          ...theme.applyStyles("dark", {
            border: "1px solid rgba(255, 255, 255, 0.14)",
          }),
        })}
      >
        {/* Floating action: Edit ↔ Done */}
        <Box
          contentEditable={false}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 2,
          }}
        >
          <Tooltip title={showEditor ? "Done" : "Edit source"}>
            <IconButton
              size="small"
              onClick={() => setEditing((v) => !v)}
              sx={(theme) => ({
                width: 28,
                height: 28,
                borderRadius: "6px",
                backgroundColor: "rgba(251, 248, 239, 0.85)",
                border: "1px solid rgba(135, 131, 120, 0.2)",
                backdropFilter: "blur(8px)",
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: "rgba(139, 155, 110, 0.15)",
                  color: "text.primary",
                },
                ...theme.applyStyles("dark", {
                  backgroundColor: "rgba(20, 18, 11, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                }),
              })}
            >
              {showEditor ? (
                <CheckRoundedIcon sx={{ fontSize: 16 }} />
              ) : (
                <EditOutlinedIcon sx={{ fontSize: 15 }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Rendered diagram */}
        {svg && !error && (
          <Box
            contentEditable={false}
            sx={{
              p: 3,
              display: "flex",
              justifyContent: "center",
              backgroundColor: "background.paper",
              "& svg": { maxWidth: "100%", height: "auto" },
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}

        {/* Error pane (shown alongside the editor while editing) */}
        {error && (
          <Box
            contentEditable={false}
            sx={(theme) => ({
              px: 2,
              py: 1.25,
              fontSize: "0.78rem",
              color: "error.main",
              fontFamily: "'SF Mono', 'JetBrains Mono', Menlo, monospace",
              whiteSpace: "pre-wrap",
              backgroundColor: "rgba(220, 80, 80, 0.06)",
              borderBottom: "1px solid rgba(220, 80, 80, 0.15)",
              ...theme.applyStyles("dark", {
                backgroundColor: "rgba(220, 80, 80, 0.1)",
              }),
            })}
          >
            {error}
          </Box>
        )}

        {/* Empty placeholder for fresh blocks */}
        {empty && !showEditor && (
          <Box
            contentEditable={false}
            sx={{
              p: 3,
              textAlign: "center",
              color: "text.disabled",
              fontSize: "0.85rem",
            }}
          >
            <Typography sx={{ fontSize: "0.85rem", color: "text.disabled" }}>
              Empty diagram — click the edit icon to add Mermaid source.
            </Typography>
          </Box>
        )}

        {/* Editor (the actual ProseMirror content) — always rendered for editability,
            but hidden in view mode so the rendered SVG is the only thing visible. */}
        <Box
          component="pre"
          sx={(theme) => ({
            margin: 0,
            padding: "12px 16px",
            fontFamily: "'SF Mono', 'JetBrains Mono', Menlo, monospace",
            fontSize: "0.78rem",
            lineHeight: 1.55,
            color: "text.secondary",
            overflow: "auto",
            display: showEditor ? "block" : "none",
            borderTop:
              svg && !error ? "1px solid rgba(135, 131, 120, 0.14)" : "none",
            ...theme.applyStyles("dark", {
              borderTop:
                svg && !error ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
            }),
          })}
        >
          <NodeViewContent />
        </Box>
      </Box>
    </NodeViewWrapper>
  );
}
