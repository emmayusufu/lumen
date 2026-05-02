"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import { SectionHeading } from "../_components/SectionHeading";
import { ApiKeysSection } from "./_components/ApiKeysSection";

export default function ApiKeysPage() {
  return (
    <Box sx={{ maxWidth: 640, mx: "auto", width: "100%" }}>
      <SectionHeading
        Icon={VpnKeyOutlinedIcon}
        title="API Keys"
        description="Configure DeepSeek for AI features. Personal keys take precedence over the workspace key."
      />
      <Typography sx={{ fontSize: "0.86rem", color: "text.secondary", mb: 4 }}>
        Need a key? Get one at{" "}
        <Box
          component="a"
          href="https://platform.deepseek.com"
          target="_blank"
          rel="noreferrer"
          sx={{
            color: "primary.main",
            textDecoration: "none",
            borderBottom: "1px solid",
            borderColor: "primary.main",
            "&:hover": { opacity: 0.75 },
          }}
        >
          platform.deepseek.com
        </Box>
        .
      </Typography>
      <ApiKeysSection />
    </Box>
  );
}
