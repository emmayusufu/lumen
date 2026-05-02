import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { PlantumlBlock } from "../PlantumlBlock";

export interface PlantumlOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    plantuml: {
      setPlantumlBlock: () => ReturnType;
    };
  }
}

const SEED = `@startuml
skinparam classAttributeIconSize 0

abstract class Account {
  +UUID id
  +String email
  -String passwordHash
  +login(): void
  +logout(): void
}

class User extends Account {
  +String name
  +Boolean isAdmin
  +signup(): Workspace
  +deleteAccount(): void
}

class AdminUser extends User {
  +banUser(User): void
}

class Workspace {
  +UUID id
  +String slug
  +String name
}

class Doc {
  +UUID id
  +String title
  +String content
  +save(): void
}

User "1" *-- "*" Workspace : owns
Workspace "1" *-- "*" Doc : contains
User ..> Doc : edits

@enduml`;

export const Plantuml = Node.create<PlantumlOptions>({
  name: "plantuml",
  group: "block",
  content: "text*",
  marks: "",
  defining: true,
  isolating: true,
  code: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="plantuml"]', preserveWhitespace: "full" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": "plantuml" },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PlantumlBlock);
  },

  addCommands() {
    return {
      setPlantumlBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            content: [{ type: "text", text: SEED }],
          }),
    };
  },
});
