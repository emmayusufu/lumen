"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function PrivacyPage() {
  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        backgroundColor: "#EEE8D8",
        color: "#2A2520",
        fontFamily: "var(--font-nunito), sans-serif",
        ...theme.applyStyles("dark", {
          backgroundColor: "#121006",
          color: "#EBE6D9",
        }),
      })}
    >
      <Box
        component="nav"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 3, md: 8 },
          py: 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          component={Link}
          href="/"
          sx={{
            fontSize: "1.35rem",
            fontWeight: 900,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          Lumen
        </Typography>
      </Box>

      <Box
        component="main"
        sx={{
          px: { xs: 3, md: 8 },
          py: { xs: 8, md: 12 },
          maxWidth: 760,
          mx: "auto",
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: "2.2rem", md: "3rem" },
            fontWeight: 900,
            mb: 1,
          }}
        >
          Privacy Policy
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.9rem", mb: 6 }}>
          Last updated: April 2026
        </Typography>

        <Section title="Who we are">
          Lumen is open-source software. This policy applies to the hosted
          instance you are using. Self-hosters of the source code are
          responsible for their own privacy policies. The contact for this
          instance is the operator listed in the footer or in the GitHub
          repository.
        </Section>

        <Section title="What we collect">
          To provide an account: your email address, your display name, and a
          hashed password. To deliver the service: the documents you create,
          comments you write, the workspaces you belong to, files you upload,
          and standard server logs (IP address, user agent, request path,
          timestamps) for security and abuse prevention.
        </Section>

        <Section title="What we do not collect">
          No analytics or tracking pixels on your documents. No behavioural
          profiling. No selling of data to third parties. No advertising.
        </Section>

        <Section title="How we use your data">
          We use your data only to operate the service: render your documents,
          authenticate you, share with your collaborators, and send the rare
          transactional email if you initiate one (e.g. password reset). Your
          documents are not used to train any AI model.
        </Section>

        <Section title="Third-party processors">
          When you invoke an AI feature (inline edit, summarize, fact-check),
          the relevant passage is sent to the configured LLM provider (DeepSeek
          by default) and search provider (Serper for fact-check) to return a
          result. We do not retain those API exchanges beyond standard server
          logs. Self-hosters can swap or disable these providers in
          configuration.
        </Section>

        <Section title="Storage and security">
          Data is stored in PostgreSQL and S3-compatible object storage on our
          infrastructure. Passwords are hashed with bcrypt. Auth tokens are
          HTTP-only cookies. We do not encrypt document contents at the
          application layer; if you need stronger guarantees, run your own
          self-hosted instance.
        </Section>

        <Section title="Your rights">
          You can export your documents as Markdown or PDF at any time. You can
          delete your account from Settings, which anonymizes your personal
          information and removes your private documents. Documents you
          co-authored in shared workspaces remain with the workspace, attributed
          to a deleted user. If you need a full data export or a different
          deletion treatment, email the operator.
        </Section>

        <Section title="Cookies">
          We set one HTTP-only authentication cookie when you sign in. No
          marketing or analytics cookies.
        </Section>

        <Section title="Changes">
          If we make material changes, we will note them here and update the
          “Last updated” date. Substantive changes will be communicated via the
          dashboard.
        </Section>

        <Box sx={{ mt: 6 }}>
          <Typography
            component={Link}
            href="/"
            sx={{
              color: "primary.main",
              textDecoration: "none",
              fontWeight: 600,
              "&:hover": { opacity: 0.7 },
            }}
          >
            ← Back home
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        component="h2"
        sx={{ fontSize: "1.15rem", fontWeight: 800, mb: 1.25 }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          fontSize: "1rem",
          color: "text.secondary",
          lineHeight: 1.7,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}
