"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { PeopleList } from "@/components/settings/PeopleList";

export default function PeoplePage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 720 }}>
      <Box>
        <Typography
          sx={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em", mb: 1 }}
        >
          People
        </Typography>
        <Typography sx={{ fontSize: "0.9rem", color: "text.secondary" }}>
          Everyone you&apos;ve invited to docs you own. Expand a person to see per-doc access.
        </Typography>
      </Box>
      <PeopleList />
    </Box>
  );
}
