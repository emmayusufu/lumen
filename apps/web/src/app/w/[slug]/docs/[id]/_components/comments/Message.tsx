import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Avatar } from "./Avatar";
import { timeAgo } from "./timeAgo";

interface Props {
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  isFirst: boolean;
}

export function Message({
  authorId,
  authorName,
  body,
  createdAt,
  isFirst,
}: Props) {
  return (
    <Box sx={{ display: "flex", gap: 1.25, pt: isFirst ? 0 : 1.25, pb: 0 }}>
      <Avatar userId={authorId} name={authorName} size={isFirst ? 26 : 22} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
          <Typography
            sx={{ fontSize: "0.8rem", fontWeight: 700, color: "text.primary" }}
          >
            {authorName}
          </Typography>
          <Typography sx={{ fontSize: "0.68rem", color: "text.disabled" }}>
            {timeAgo(createdAt)}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: "0.86rem",
            lineHeight: 1.5,
            color: "text.primary",
            whiteSpace: "pre-wrap",
            mt: 0.125,
          }}
        >
          {body}
        </Typography>
      </Box>
    </Box>
  );
}
