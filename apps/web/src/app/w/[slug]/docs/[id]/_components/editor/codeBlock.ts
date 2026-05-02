import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { createLowlight, common } from "lowlight";
import { CodeBlock } from "../CodeBlock";

const customCommon = { ...common };
delete (customCommon as Record<string, unknown>).shell;
delete (customCommon as Record<string, unknown>)["python-repl"];
delete (customCommon as Record<string, unknown>)["php-template"];

export const lowlight = createLowlight(customCommon as typeof common);

export const LumenCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlock);
  },
});
