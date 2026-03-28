"use client";

import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import LinkIcon from "@mui/icons-material/Link";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import type { ResearchResult } from "@/lib/types";

interface SourceListProps {
  sources: ResearchResult[];
}

export function SourceList({ sources }: SourceListProps) {
  if (sources.length === 0) return null;

  return (
    <Paper variant="outlined" sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ p: 1.5, pb: 0 }}>
        Sources
      </Typography>
      <List dense>
        {sources.map((source, index) => (
          <ListItemButton
            key={index}
            component="a"
            href={source.source_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <LinkIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={source.title}
              secondary={source.source_url}
              primaryTypographyProps={{ variant: "body2" }}
              secondaryTypographyProps={{ variant: "caption", noWrap: true }}
            />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
}
