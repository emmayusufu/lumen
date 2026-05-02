import Box from "@mui/material/Box";

const INITIALS = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || "?";

const COLORS = [
  "#8B9B6E",
  "#B8804A",
  "#6E8B9B",
  "#9B6E8B",
  "#6E9B8B",
  "#9B8B6E",
];

function colorFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

export function Avatar({
  userId,
  name,
  size = 26,
}: {
  userId: string;
  name: string;
  size?: number;
}) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: colorFor(userId),
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size <= 22 ? "0.62rem" : "0.72rem",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {INITIALS(name)}
    </Box>
  );
}
