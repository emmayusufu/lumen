import DOMPurify from "dompurify";
import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: true,
});

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "em",
    "s",
    "u",
    "code",
    "pre",
    "blockquote",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "a",
    "hr",
  ],
  ALLOWED_ATTR: ["href", "title"],
};

export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";
  const raw = marked.parse(markdown, { async: false }) as string;
  return DOMPurify.sanitize(raw, PURIFY_CONFIG);
}

export function looksLikeMarkdown(text: string): boolean {
  if (!text) return false;
  return /(^|\n)#{1,6}\s|(^|\n)[-*+]\s|(^|\n)\d+\.\s|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\)/.test(
    text,
  );
}
