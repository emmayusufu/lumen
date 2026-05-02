import type { Theme } from "@mui/material/styles";

export const menuPaperSx = (theme: Theme) => ({
  mt: 0.75,
  minWidth: 200,
  borderRadius: "10px",
  border: "1px solid",
  borderColor: "divider",
  boxShadow: "none",
  py: 0.5,
  backgroundColor: "#FAF8F3",
  ...theme.applyStyles("dark", { backgroundColor: "#121006" }),
  "& .MuiMenuItem-root": {
    borderRadius: "6px",
    mx: "4px",
    width: "calc(100% - 8px)",
    fontSize: "0.82rem",
  },
  "& .MuiMenuItem-root.Mui-selected": { backgroundColor: "transparent" },
  "& .MuiMenuItem-root.Mui-selected:hover": { backgroundColor: "action.hover" },
});
