"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface Props {
  Icon: React.ElementType;
  title: string;
  description?: string;
}

export function SectionHeading({ Icon, title, description }: Props) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={(theme) => ({
          width: 36,
          height: 36,
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(139, 155, 110, 0.14)",
          color: "primary.main",
          mb: 2,
          ...theme.applyStyles("dark", {
            backgroundColor: "rgba(186, 200, 160, 0.12)",
            color: "primary.dark",
          }),
        })}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Typography
        component="h1"
        sx={{
          fontSize: "2rem",
          fontWeight: 800,
          lineHeight: 1.05,
          mb: description ? 1.5 : 0,
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          sx={{
            fontSize: "0.95rem",
            color: "text.secondary",
            lineHeight: 1.5,
            maxWidth: 560,
          }}
        >
          {description}
        </Typography>
      )}
    </Box>
  );
}
