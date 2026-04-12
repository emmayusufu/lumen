"use client";

import { useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Popover from "@mui/material/Popover";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

const LANGUAGE_LABELS: Record<string, string> = {
  plaintext: "Plain text",
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  "python-repl": "Python REPL",
  bash: "Bash",
  shell: "Shell",
  go: "Go",
  rust: "Rust",
  java: "Java",
  kotlin: "Kotlin",
  swift: "Swift",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  css: "CSS",
  scss: "SCSS",
  less: "Less",
  html: "HTML",
  xml: "XML",
  json: "JSON",
  yaml: "YAML",
  markdown: "Markdown",
  sql: "SQL",
  php: "PHP",
  "php-template": "PHP Template",
  ruby: "Ruby",
  r: "R",
  lua: "Lua",
  perl: "Perl",
  graphql: "GraphQL",
  diff: "Diff",
  makefile: "Makefile",
  objectivec: "Objective-C",
  arduino: "Arduino",
  ini: "INI",
  vbnet: "VB.NET",
  wasm: "WebAssembly",
};

const labelFor = (lang: string) =>
  LANGUAGE_LABELS[lang] ?? lang.charAt(0).toUpperCase() + lang.slice(1);

export function CodeBlock({ node, updateAttributes, extension }: NodeViewProps) {
  const [copied, setCopied] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);

  const lowlight = extension.options.lowlight;
  const supported: string[] = (lowlight?.listLanguages?.() ?? []) as string[];
  const sorted = useMemo(
    () => [...supported].sort((a, b) => labelFor(a).localeCompare(labelFor(b))),
    [supported],
  );
  const current: string = node.attrs.language ?? "";

  const detected = useMemo(() => {
    if (current || !node.textContent.trim()) return null;
    try {
      const result = lowlight?.highlightAuto?.(node.textContent);
      const lang = result?.data?.language as string | undefined;
      return lang && supported.includes(lang) ? lang : null;
    } catch {
      return null;
    }
  }, [current, node.textContent, lowlight, supported]);

  const currentLabel = current ? labelFor(current) : detected ? labelFor(detected) : "Plain text";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((l) => labelFor(l).toLowerCase().includes(q) || l.toLowerCase().includes(q));
  }, [sorted, query]);

  const handleOpen = () => {
    setQuery("");
    setAnchor(triggerRef.current);
  };

  const handlePick = (lang: string | null) => {
    updateAttributes({ language: lang });
    setAnchor(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(node.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  return (
    <NodeViewWrapper as="div" className="lumen-codeblock">
      <Box
        contentEditable={false}
        suppressContentEditableWarning
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pl: 1.25,
          pr: 0.75,
          py: 0.625,
          borderBottom: "1px solid",
          borderColor: "rgba(139, 155, 110, 0.22)",
          backgroundColor: "rgba(139, 155, 110, 0.08)",
          ...theme.applyStyles("dark", {
            borderColor: "rgba(186, 200, 160, 0.2)",
            backgroundColor: "rgba(186, 200, 160, 0.06)",
          }),
        })}
      >
        <Box
          component="button"
          ref={triggerRef}
          onClick={handleOpen}
          type="button"
          sx={(theme) => ({
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 0.875,
            py: 0.375,
            border: "none",
            borderRadius: "6px",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontFamily: "'SF Mono', 'JetBrains Mono', 'Fira Code', Menlo, monospace",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "-0.005em",
            color: "text.secondary",
            transition: "all 0.15s ease",
            "&:hover": {
              backgroundColor: "rgba(139, 155, 110, 0.14)",
              color: "text.primary",
            },
            ...theme.applyStyles("dark", {
              "&:hover": {
                backgroundColor: "rgba(186, 200, 160, 0.12)",
              },
            }),
          })}
        >
          {currentLabel}
          <KeyboardArrowDownRoundedIcon sx={{ fontSize: 14, opacity: 0.7 }} />
        </Box>
        <Tooltip title={copied ? "Copied" : "Copy"}>
          <IconButton
            onClick={handleCopy}
            size="small"
            sx={(theme) => ({
              width: 26,
              height: 26,
              color: "text.secondary",
              "&:hover": { backgroundColor: "rgba(139, 155, 110, 0.14)", color: "text.primary" },
              ...theme.applyStyles("dark", {
                "&:hover": { backgroundColor: "rgba(186, 200, 160, 0.12)" },
              }),
            })}
          >
            {copied ? <CheckRoundedIcon sx={{ fontSize: 13 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />}
          </IconButton>
        </Tooltip>
      </Box>
      <pre>
        <NodeViewContent />
      </pre>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              width: 240,
              maxHeight: 340,
              borderRadius: "10px",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 12px 32px rgba(42, 37, 32, 0.12)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
        <Box
          sx={(theme) => ({
            display: "flex",
            alignItems: "center",
            gap: 0.875,
            px: 1.5,
            py: 1.125,
            borderBottom: "1px solid",
            borderColor: "divider",
            backgroundColor: "#FBF9F3",
            ...theme.applyStyles("dark", {
              backgroundColor: "rgba(255,255,255,0.02)",
            }),
          })}
        >
          <SearchRoundedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
          <InputBase
            autoFocus
            placeholder="Search language…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{
              flex: 1,
              fontSize: "0.78rem",
              "& input": { p: 0 },
              "& input::placeholder": { color: "text.disabled", opacity: 1 },
            }}
          />
        </Box>
        <Box sx={{ overflowY: "auto", py: 0.5 }}>
          <Box
            onClick={() => handlePick(null)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1.5,
              py: 0.75,
              cursor: "pointer",
              fontSize: "0.78rem",
              fontStyle: "italic",
              color: "text.secondary",
              "&:hover": { backgroundColor: "rgba(139, 155, 110, 0.1)" },
            }}
          >
            <Box component="span">
              Auto-detect
              {detected && (
                <Box component="span" sx={{ ml: 0.75, opacity: 0.65, fontStyle: "normal", fontSize: "0.7rem" }}>
                  · {labelFor(detected)}
                </Box>
              )}
            </Box>
            {!current && <CheckRoundedIcon sx={{ fontSize: 13, color: "primary.main" }} />}
          </Box>
          {filtered.length === 0 ? (
            <Typography sx={{ px: 1.5, py: 1.5, fontSize: "0.75rem", color: "text.disabled", textAlign: "center" }}>
              No languages match
            </Typography>
          ) : (
            filtered.map((lang) => {
              const active = lang === current;
              return (
                <Box
                  key={lang}
                  onClick={() => handlePick(lang)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1.5,
                    py: 0.75,
                    cursor: "pointer",
                    fontSize: "0.78rem",
                    fontWeight: active ? 600 : 500,
                    color: active ? "primary.main" : "text.primary",
                    backgroundColor: active ? "rgba(139, 155, 110, 0.1)" : "transparent",
                    "&:hover": { backgroundColor: "rgba(139, 155, 110, 0.14)" },
                  }}
                >
                  {labelFor(lang)}
                  {active && <CheckRoundedIcon sx={{ fontSize: 13 }} />}
                </Box>
              );
            })
          )}
        </Box>
      </Popover>
    </NodeViewWrapper>
  );
}
