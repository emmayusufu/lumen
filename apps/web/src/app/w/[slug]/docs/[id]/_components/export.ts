import TurndownService from "turndown";

const td = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "_",
});

td.addRule("codeBlockLanguage", {
  filter: (node) =>
    node.nodeName === "PRE" && node.firstChild?.nodeName === "CODE",
  replacement: (_content, node) => {
    const code = node.firstChild as HTMLElement;
    const lang = (code.className.match(/language-(\w+)/) || [])[1] ?? "";
    return `\n\n\`\`\`${lang}\n${code.textContent ?? ""}\n\`\`\`\n\n`;
  },
});

function sanitizeFilename(title: string): string {
  return (
    title
      .trim()
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase() || "untitled"
  );
}

function toMarkdown(title: string, html: string): string {
  return `# ${title}\n\n${td.turndown(html)}\n`;
}

export async function copyMarkdown(title: string, html: string): Promise<void> {
  await navigator.clipboard.writeText(toMarkdown(title, html));
}

export function downloadMarkdown(title: string, html: string) {
  const md = toMarkdown(title, html);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilename(title)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadPdf(docId: string, title: string): Promise<void> {
  const res = await fetch(
    `/api/backend/api/v1/content/docs/${docId}/export/pdf`,
  );
  if (!res.ok) throw new Error(`PDF export failed: ${res.statusText}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilename(title)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
