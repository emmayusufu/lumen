"use client";

import { useState } from "react";
import { menuPaperSx } from "@repo/ui";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import Tooltip from "@mui/material/Tooltip";
import { copyMarkdown, downloadMarkdown, downloadPdf } from "./export";

interface Props {
  docId: string;
  title: string;
  html: string;
  onSummarize?: () => void;
  onFactCheck?: () => void;
}

export function DocMenu({
  docId,
  title,
  html,
  onSummarize,
  onFactCheck,
}: Props) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const close = () => setAnchor(null);
  const safeTitle = title.trim() || "Untitled";

  const handleCopy = async () => {
    await copyMarkdown(safeTitle, html);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      close();
    }, 900);
  };

  return (
    <>
      <Tooltip title="More">
        <IconButton
          size="small"
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{
            width: 32,
            height: 32,
            color: "text.secondary",
            opacity: 0.7,
            transition: "all 0.2s",
            "&:hover": {
              opacity: 1,
              color: "primary.main",
              backgroundColor: "transparent",
            },
          }}
        >
          <MoreHorizRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: menuPaperSx } }}
      >
        {onSummarize && (
          <MenuItem
            onClick={() => {
              onSummarize();
              close();
            }}
          >
            <ListItemIcon>
              <AutoAwesomeRoundedIcon
                sx={{ fontSize: 17, color: "primary.main" }}
              />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: "0.82rem" }}>
              Summarize doc
            </ListItemText>
          </MenuItem>
        )}
        {onFactCheck && (
          <MenuItem
            onClick={() => {
              onFactCheck();
              close();
            }}
          >
            <ListItemIcon>
              <FactCheckOutlinedIcon sx={{ fontSize: 17 }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: "0.82rem" }}>
              Fact check
            </ListItemText>
          </MenuItem>
        )}
        {(onSummarize || onFactCheck) && <Divider sx={{ my: 0.5, mx: 1 }} />}
        <MenuItem onClick={() => void handleCopy()}>
          <ListItemIcon>
            {copied ? (
              <CheckRoundedIcon sx={{ fontSize: 17, color: "primary.main" }} />
            ) : (
              <ContentCopyOutlinedIcon sx={{ fontSize: 17 }} />
            )}
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.82rem" }}>
            {copied ? "Copied" : "Copy as Markdown"}
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            downloadMarkdown(safeTitle, html);
            close();
          }}
        >
          <ListItemIcon>
            <FileDownloadOutlinedIcon sx={{ fontSize: 17 }} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.82rem" }}>
            Export as Markdown
          </ListItemText>
        </MenuItem>
        <MenuItem
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await downloadPdf(docId, safeTitle);
            } finally {
              setBusy(false);
              close();
            }
          }}
        >
          <ListItemIcon>
            <PictureAsPdfOutlinedIcon sx={{ fontSize: 17 }} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.82rem" }}>
            {busy ? "Generating…" : "Export as PDF"}
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
