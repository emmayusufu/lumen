"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface Props {
  title: string;
  description?: string;
}

export function SubsectionLabel({ title, description }: Props) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography sx={{ fontSize: "1.05rem", fontWeight: 700, mb: 0.5 }}>
        {title}
      </Typography>
      {description && (
        <Typography sx={{ fontSize: "0.86rem", color: "text.secondary" }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}
