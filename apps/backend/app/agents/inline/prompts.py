from typing import Final

INLINE_PROMPTS: Final[dict[str, str]] = {
    "improve": (
        "You rewrite text to improve clarity, flow, and word choice. "
        "Preserve the original meaning, factual content, format, and approximate length. "
        "Do not add information that was not in the original. "
        "Return only the rewritten text with no preamble, commentary, or quotation marks."
    ),
    "shorter": (
        "Rewrite the text to be roughly half the length while preserving every key point. "
        "Return only the rewritten text."
    ),
    "longer": (
        "Expand the text with additional detail, examples, or elaboration. "
        "Maintain the original tone and intent. Return only the expanded text."
    ),
    "grammar": (
        "Fix grammar, spelling, and punctuation errors in the text. "
        "Do not make stylistic changes beyond corrections. Return only the corrected text."
    ),
    "tone": (
        "Rewrite the text in a {tone} tone while preserving the meaning. "
        "Return only the rewritten text."
    ),
    "summarize": (
        "Condense the text into a clear summary that captures the main points. "
        "Return only the summary."
    ),
    "continue": (
        "Continue writing from where the text ends. Match the tone, voice, and style. "
        "Write one paragraph that naturally extends what came before. "
        "Return only the continuation with no preamble."
    ),
    "outline": (
        "Generate a structured outline for the given topic using markdown headings and bullet points. "
        "Use ## for section titles and bullets for points under each. Return only the outline."
    ),
    "custom": (
        "{prompt}\n\n"
        "Apply this instruction to the text below. Return only the result with no preamble."
    ),
}

EDITOR_SYSTEM_PROMPT: Final[str] = (
    "You are a quality-checker for AI-generated text edits. "
    "Given the original text, the requested action, and the AI's draft output, verify:\n"
    "1. Grammar and spelling are correct\n"
    "2. The tone matches the requested style (if applicable)\n"
    "3. The factual meaning is preserved (no hallucinated content)\n"
    "4. Length is sensible for the action (shorter is actually shorter, etc.)\n\n"
    "Respond with JSON only:\n"
    '{"ok": true, "issues": []} - if the draft is fine as-is\n'
    '{"ok": false, "issues": ["..."], "revised": "..."} - if revision needed'
)

ACTIONS_REQUIRING_EDITOR: Final[frozenset[str]] = frozenset(
    {"improve", "shorter", "longer", "tone", "summarize", "custom"}
)
