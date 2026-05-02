"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function Showcase() {
  return (
    <Box
      sx={(theme) => ({
        mx: { xs: 1.5, md: "auto" },
        mb: { xs: 8, md: 12 },
        maxWidth: 1200,
        borderRadius: "16px",
        overflow: "hidden",
        backgroundColor: "#2A2520",
        color: "#EBE6D9",
        p: { xs: 4, md: 8 },
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { md: "center" },
        gap: 4,
        ...theme.applyStyles("dark", {
          backgroundColor: "rgba(255,255,255,0.04)",
          border: "1px solid",
          borderColor: "divider",
        }),
      })}
    >
      <Box sx={{ flex: 1 }}>
        <Typography
          component="h2"
          sx={{
            fontSize: { xs: "1.8rem", md: "2.4rem" },
            fontWeight: 900,
            lineHeight: 1.1,
            color: "#EBE6D9",
            mb: 1.5,
          }}
        >
          Two cursors.
          <br />
          One document.
        </Typography>
        <Typography
          sx={{
            fontSize: "1rem",
            color: "rgba(235,230,217,0.65)",
            lineHeight: 1.6,
            maxWidth: 440,
          }}
        >
          Watch edits land in real time as your teammate types. Yjs CRDTs handle
          merge conflicts so you never overwrite each other. Works offline too —
          syncs when you reconnect.
        </Typography>
      </Box>
      <Box
        sx={{
          flex: 1,
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid rgba(235,230,217,0.1)",
        }}
      >
        <Image
          src="/screenshot-comments.png"
          alt="Threaded comments in Lumen"
          width={600}
          height={400}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </Box>
    </Box>
  );
}
