"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { PersonRow } from "./PersonRow";
import { useMyCollaborators } from "./useMyCollaborators";

export function PeopleList() {
  const { list, loading, removeFromAll, removeFromSingleDoc, updateRoleOnDoc } =
    useMyCollaborators();

  if (loading) {
    return (
      <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>
        Loading…
      </Typography>
    );
  }

  if (list.length === 0) {
    return (
      <Box
        sx={{
          p: 4,
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: "10px",
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontSize: "0.9rem", color: "text.secondary" }}>
          You haven&apos;t invited anyone to your docs yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {list.map((p) => (
        <PersonRow
          key={p.user_id}
          person={p}
          onRemoveFromDoc={(docId) => removeFromSingleDoc(docId, p.user_id)}
          onRemoveFromAll={() => removeFromAll(p.user_id)}
          onUpdateRole={(docId, role) =>
            updateRoleOnDoc(docId, p.user_id, role)
          }
        />
      ))}
    </Box>
  );
}
