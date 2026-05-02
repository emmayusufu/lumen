import os
from html import escape
from io import BytesIO

from weasyprint import HTML

_BASE_CSS = """
@page { size: A4; margin: 2.5cm; }
body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
       color: #1a1a1a; line-height: 1.65; font-size: 11pt; }
h1.doc-title { font-size: 26pt; font-weight: 800; letter-spacing: -0.02em;
               margin: 0 0 0.2em; border-bottom: 1pt solid #8B9B6E;
               padding-bottom: 0.4em; }
h1 { font-size: 22pt; font-weight: 800; letter-spacing: -0.02em; margin: 1em 0 0.4em; }
h2 { font-size: 17pt; font-weight: 700; margin: 1.4em 0 0.4em; }
h3 { font-size: 14pt; font-weight: 700; margin: 1.1em 0 0.3em; }
p  { margin: 0.6em 0; }
pre { background: #f4f2ea; padding: 12pt; border-radius: 6pt;
      font-size: 9.5pt; white-space: pre-wrap; word-wrap: break-word;
      font-family: ui-monospace, "SF Mono", Menlo, monospace; }
code { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 0.9em; }
blockquote { border-left: 3pt solid #8B9B6E; padding-left: 12pt;
             color: #555; font-style: italic; margin: 1em 0; }
img { max-width: 100%; height: auto; border-radius: 4pt; margin: 1em 0; }
ul, ol { padding-left: 22pt; }
li { margin: 0.2em 0; }
a { color: #8B9B6E; text-decoration: none; }
table { width: 100%; border-collapse: collapse; margin: 1em 0; }
th, td { border: 0.5pt solid #cfcab7; padding: 6pt 9pt; vertical-align: top; }
th { background: #f4f2ea; font-weight: 700; text-align: left; }
"""


def _rewrite_internal_urls(html: str) -> str:
    public = os.environ.get("MINIO_PUBLIC_ENDPOINT")
    internal = os.environ.get("MINIO_ENDPOINT")
    if public and internal and public != internal:
        html = html.replace(public, internal)
    return html


def render_pdf(title: str, html: str) -> bytes:
    safe_title = escape(title.strip() or "Untitled")
    body = _rewrite_internal_urls(html)
    document = f"""<!doctype html><html><head><meta charset="utf-8">
<style>{_BASE_CSS}</style></head><body>
<h1 class="doc-title">{safe_title}</h1>
{body}
</body></html>"""
    buf = BytesIO()
    HTML(string=document).write_pdf(buf)
    return buf.getvalue()
