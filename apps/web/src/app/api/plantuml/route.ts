import { NextResponse } from "next/server";

const KROKI = process.env.KROKI_URL ?? "http://kroki:8000";
const MAX_SOURCE = 64 * 1024;

function injectStyleDefaults(source: string): string {
  const hasBg = /skinparam\s+backgroundColor/i.test(source);
  const hasFont = /skinparam\s+defaultFontName/i.test(source);
  let inject = "";
  if (!hasBg) inject += "skinparam backgroundColor transparent\n";
  if (!hasFont) inject += "skinparam defaultFontName SansSerif\n";
  if (!inject) return source;
  return source.replace(/(@start\w+[^\n]*\n)/i, `$1${inject}`);
}

export async function POST(req: Request) {
  const source = await req.text();
  if (!source.trim()) {
    return new NextResponse("Empty source", { status: 400 });
  }
  if (source.length > MAX_SOURCE) {
    return new NextResponse("Source too large", { status: 413 });
  }
  try {
    const upstream = await fetch(`${KROKI}/plantuml/svg`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: injectStyleDefaults(source),
      signal: AbortSignal.timeout(15_000),
    });
    if (!upstream.ok) {
      const detail = await upstream.text();
      return new NextResponse(detail || "Render failed", {
        status: upstream.status,
      });
    }
    const svg = await upstream.text();
    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new NextResponse(`Kroki unavailable: ${msg}`, { status: 502 });
  }
}
