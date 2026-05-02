"use client";

import Box from "@mui/material/Box";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { SectionHeading } from "../_components/SectionHeading";
import { SubsectionLabel } from "../_components/SubsectionLabel";
import { ProfileForm } from "./_components/ProfileForm";
import { PasswordForm } from "./_components/PasswordForm";
import { DeleteAccountSection } from "./_components/DeleteAccountSection";

export default function ProfilePage() {
  return (
    <Box sx={{ maxWidth: 640, mx: "auto", width: "100%" }}>
      <SectionHeading
        Icon={PersonOutlineRoundedIcon}
        title="Profile"
        description="Your name and sign-in email. Changing your email requires your current password — this keeps accidental or malicious takeovers out."
      />

      <ProfileForm />

      <Box
        sx={{
          mt: 6,
          pt: 6,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <SubsectionLabel
          title="Password"
          description="Change the password you use to sign in."
        />
        <PasswordForm />
      </Box>

      <Box
        sx={{
          mt: 6,
          pt: 6,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <DeleteAccountSection />
      </Box>
    </Box>
  );
}
