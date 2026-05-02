import type { Editor } from "@tiptap/react";
import Typography from "@mui/material/Typography";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import SchemaOutlinedIcon from "@mui/icons-material/SchemaOutlined";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";

export const withSlashDelete = (fn: (e: Editor) => void) => (e: Editor) => {
  const { $anchor } = e.state.selection;
  if ($anchor.parent.textContent === "/") {
    e.chain()
      .deleteRange({ from: $anchor.pos - 1, to: $anchor.pos })
      .run();
  }
  fn(e);
};

export const FORMATS = [
  {
    Icon: FormatBoldIcon,
    mark: "bold",
    fn: (e: Editor) => e.chain().focus().toggleBold().run(),
  },
  {
    Icon: FormatItalicIcon,
    mark: "italic",
    fn: (e: Editor) => e.chain().focus().toggleItalic().run(),
  },
  {
    Icon: FormatStrikethroughIcon,
    mark: "strike",
    fn: (e: Editor) => e.chain().focus().toggleStrike().run(),
  },
  {
    Icon: CodeRoundedIcon,
    mark: "code",
    fn: (e: Editor) => e.chain().focus().toggleCode().run(),
  },
];

export type BlockGroup = {
  label: string;
  items: {
    label: string;
    hint: string;
    Icon: React.ElementType;
    cmd: (e: Editor) => void;
  }[];
};

const H = (text: string) => {
  const HeadingMark = () => (
    <Typography
      sx={{
        fontSize: "0.7rem",
        fontWeight: 800,
        lineHeight: 1,
        color: "text.secondary",
        minWidth: 14,
      }}
    >
      {text}
    </Typography>
  );
  HeadingMark.displayName = `HeadingMark(${text})`;
  return HeadingMark;
};

export const BASE_BLOCK_GROUPS: BlockGroup[] = [
  {
    label: "Text",
    items: [
      {
        label: "Text",
        hint: "Plain paragraph",
        Icon: NotesRoundedIcon,
        cmd: withSlashDelete((e) => e.chain().focus().setParagraph().run()),
      },
      {
        label: "Heading 1",
        hint: "Big title",
        Icon: H("H1"),
        cmd: withSlashDelete((e) =>
          e.chain().focus().setHeading({ level: 1 }).run(),
        ),
      },
      {
        label: "Heading 2",
        hint: "Section title",
        Icon: H("H2"),
        cmd: withSlashDelete((e) =>
          e.chain().focus().setHeading({ level: 2 }).run(),
        ),
      },
      {
        label: "Heading 3",
        hint: "Sub-section",
        Icon: H("H3"),
        cmd: withSlashDelete((e) =>
          e.chain().focus().setHeading({ level: 3 }).run(),
        ),
      },
    ],
  },
  {
    label: "List",
    items: [
      {
        label: "Bullet list",
        hint: "Unordered",
        Icon: FormatListBulletedRoundedIcon,
        cmd: withSlashDelete((e) => e.chain().focus().toggleBulletList().run()),
      },
      {
        label: "Numbered list",
        hint: "Ordered",
        Icon: FormatListNumberedRoundedIcon,
        cmd: withSlashDelete((e) =>
          e.chain().focus().toggleOrderedList().run(),
        ),
      },
    ],
  },
  {
    label: "Other",
    items: [
      {
        label: "Code block",
        hint: "Monospace",
        Icon: CodeRoundedIcon,
        cmd: withSlashDelete((e) => e.chain().focus().toggleCodeBlock().run()),
      },
      {
        label: "Quote",
        hint: "Callout",
        Icon: FormatQuoteRoundedIcon,
        cmd: withSlashDelete((e) => e.chain().focus().toggleBlockquote().run()),
      },
      {
        label: "Table",
        hint: "3×3 grid",
        Icon: TableChartOutlinedIcon,
        cmd: withSlashDelete((e) =>
          e
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
        ),
      },
      {
        label: "Diagram",
        hint: "Mermaid: flowchart, ER, sequence",
        Icon: AccountTreeOutlinedIcon,
        cmd: withSlashDelete((e) => e.chain().focus().setMermaidBlock().run()),
      },
      {
        label: "UML",
        hint: "PlantUML class, sequence, component",
        Icon: SchemaOutlinedIcon,
        cmd: withSlashDelete((e) => e.chain().focus().setPlantumlBlock().run()),
      },
    ],
  },
];
