"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ApiKeysSection } from "./ApiKeysSection";
import { PasswordForm } from "./PasswordForm";
import { PeopleList } from "./PeopleList";
import { ProfileForm } from "./ProfileForm";

type Section = "profile" | "api-keys" | "people";

const NAV: { id: Section; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "api-keys", label: "API Keys" },
  { id: "people", label: "People" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

function NavItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Box
      onClick={onClick}
      sx={(theme) => ({
        px: 2,
        py: 0.875,
        my: 0.125,
        borderRadius: "6px",
        fontSize: "0.84rem",
        fontWeight: active ? 600 : 500,
        color: active ? "text.primary" : "text.secondary",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.15s",
        backgroundColor: active ? "rgba(139, 155, 110, 0.14)" : "transparent",
        "&:hover": {
          backgroundColor: active ? "rgba(139, 155, 110, 0.18)" : "rgba(42, 37, 32, 0.04)",
        },
        ...theme.applyStyles("dark", {
          backgroundColor: active ? "rgba(186, 200, 160, 0.13)" : "transparent",
          "&:hover": {
            backgroundColor: active ? "rgba(186, 200, 160, 0.18)" : "rgba(235, 230, 217, 0.05)",
          },
        }),
      })}
    >
      {active && (
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: "20%",
            bottom: "20%",
            width: "2px",
            borderRadius: "0 2px 2px 0",
            backgroundColor: "primary.main",
          }}
        />
      )}
      {label}
    </Box>
  );
}

function SectionContent({ section }: { section: Section }) {
  if (section === "profile") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <Box>
          <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em", mb: 0.75 }}>
            Profile
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 3 }}>
            Update your name and email. Email changes require your current password.
          </Typography>
          <ProfileForm />
        </Box>
        <Box>
          <Typography sx={{ fontSize: "1.05rem", fontWeight: 700, mb: 0.75 }}>Password</Typography>
          <Typography sx={{ fontSize: "0.85rem", color: "text.secondary", mb: 2 }}>
            Change the password used to sign in.
          </Typography>
          <PasswordForm />
        </Box>
      </Box>
    );
  }

  if (section === "api-keys") {
    return (
      <Box>
        <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em", mb: 0.75 }}>
          API Keys
        </Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 3 }}>
          Configure DeepSeek API access. Personal keys take precedence over the workspace key.{" "}
          <Box
            component="a"
            href="https://platform.deepseek.com"
            target="_blank"
            rel="noreferrer"
            sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
          >
            Get a key
          </Box>
          .
        </Typography>
        <ApiKeysSection />
      </Box>
    );
  }

  return (
    <Box>
      <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em", mb: 0.75 }}>
        People
      </Typography>
      <Typography sx={{ fontSize: "0.875rem", color: "text.secondary", mb: 3 }}>
        Everyone you&apos;ve invited to docs you own. Expand a person to see per-doc access.
      </Typography>
      <PeopleList />
    </Box>
  );
}

export function SettingsDialog({ open, onClose }: Props) {
  const [section, setSection] = useState<Section>("profile");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: "86vh",
          maxHeight: 800,
          borderRadius: "14px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "row",
          m: 2,
        },
      }}
    >
      <Box
        sx={(theme) => ({
          width: 230,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#EEE8D8",
          borderRight: "1px solid",
          borderColor: "divider",
          px: 1.5,
          py: 3,
          ...theme.applyStyles("dark", { backgroundColor: "#121006" }),
        })}
      >
        <Typography
          sx={{
            px: 2,
            mb: 1.5,
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "text.disabled",
          }}
        >
          Settings
        </Typography>
        {NAV.map((item) => (
          <NavItem
            key={item.id}
            label={item.label}
            active={section === item.id}
            onClick={() => setSection(item.id)}
          />
        ))}
        <Box sx={{ flex: 1 }} />
        <Box sx={{ px: 1.5, pb: 0.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", fontWeight: 500 }}>
            Appearance
          </Typography>
          <ThemeToggle />
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: "absolute", top: 10, right: 10, zIndex: 1, opacity: 0.45, "&:hover": { opacity: 1 } }}
        >
          <CloseRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <Box sx={{ flex: 1, overflow: "auto", px: { xs: 3, sm: 5 }, py: 5 }}>
          <SectionContent section={section} />
        </Box>
      </Box>
    </Dialog>
  );
}
