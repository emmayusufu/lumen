"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { Header } from "@/components/layout/Header";
import { DocCard } from "@/components/docs/DocCard";
import { useDocs } from "@/hooks/useDocs";

export default function DocsPage() {
  const router = useRouter();
  const { docs, createDoc, removeDoc } = useDocs();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    const id = await createDoc();
    router.push(`/docs/${id}`);
  };

  return (
    <Box
      sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}
    >
      <Header />
      <Box sx={{ height: 56 }} />
      <Box sx={{ flex: 1, overflow: "auto", p: 3, maxWidth: 960, mx: "auto", width: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
            Docs
          </Typography>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleCreate} disabled={creating}>
            New Doc
          </Button>
        </Box>
        <Grid container spacing={2}>
          {docs.map((doc) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={doc.id}>
              <DocCard doc={doc} onDelete={removeDoc} />
            </Grid>
          ))}
          {docs.length === 0 && (
            <Grid size={12}>
              <Typography color="text.secondary">No docs yet. Create your first one.</Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
}
