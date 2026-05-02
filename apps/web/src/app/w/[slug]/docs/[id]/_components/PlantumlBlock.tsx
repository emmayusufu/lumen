"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

async function renderPlantuml(source: string): Promise<string> {
  const res = await fetch("/api/plantuml", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: source,
  });
  const body = await res.text();
  if (!res.ok) throw new Error(body || `HTTP ${res.status}`);
  return body;
}

export function PlantumlBlock({ node }: NodeViewProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    const t = setTimeout(() => {
      renderPlantuml(trimmed)
        .then((rendered) => {
          if (!cancelled) {
            setSvg(rendered);
            setError("");
          }
        })
        .catch((e) => {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : "Render failed");
            setSvg("");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 350); // debounce while typing
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [source]);

  const empty = source.trim().length === 0;
  const showEditor = editing || empty || Boolean(error);

  return (
    <NodeViewWrapper as="div" className="lumen-plantuml">
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
        <Box
          contentEditable={false}
          sx={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}
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

        {empty && !showEditor && (
          <Box contentEditable={false} sx={{ p: 3, textAlign: "center" }}>
            <Typography sx={{ fontSize: "0.85rem", color: "text.disabled" }}>
              Empty UML — click the edit icon to add PlantUML source.
            </Typography>
          </Box>
        )}

        {loading && !svg && !error && (
          <Box
            contentEditable={false}
            sx={{
              p: 3,
              textAlign: "center",
              fontSize: "0.85rem",
              color: "text.disabled",
            }}
          >
            Rendering…
          </Box>
        )}

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
