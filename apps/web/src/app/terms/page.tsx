"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function TermsPage() {
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
          Terms of Service
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.9rem", mb: 6 }}>
          Last updated: April 2026
        </Typography>

        <Section title="The short version">
          Lumen is provided as-is, free of charge, on a best-effort basis. By
          using it, you agree not to abuse the service, you keep ownership of
          your content, and you accept that the operator may suspend abusive
          accounts. The full source is on GitHub under the MIT license; if you
          want stronger guarantees, self-host.
        </Section>

        <Section title="Your account">
          You are responsible for keeping your credentials secure and for
          activity under your account. One person per account. Don’t create
          accounts for someone else without their permission.
        </Section>

        <Section title="Your content">
          You own what you write. By uploading content, you grant the operator
          the limited rights necessary to store, display, and share it with your
          chosen collaborators and to provide AI features you invoke. We claim
          no other rights to your content.
        </Section>

        <Section title="Acceptable use">
          Don’t use the service to: distribute malware, harass others, publish
          CSAM or other illegal content, scrape or stress-test the service,
          evade rate limits, or attempt unauthorized access. The operator may
          suspend or terminate accounts engaged in any of the above without
          prior notice.
        </Section>

        <Section title="AI features">
          AI suggestions are produced by third-party language models and may be
          wrong, biased, or out of date. Verify before relying on them.
          Fact-check results are signals, not guarantees. The operator is not
          liable for decisions you make based on AI output.
        </Section>

        <Section title="Service availability">
          The hosted instance is provided without uptime SLA. We may take it
          down for maintenance, migration, or shutdown. We will give reasonable
          notice for planned shutdowns and provide an export window for your
          data when feasible.
        </Section>

        <Section title="Limitation of liability">
          To the extent permitted by law, the operator and contributors are not
          liable for any indirect, incidental, or consequential damages arising
          from your use of the service. Total liability for direct damages is
          limited to the amount you have paid for the service in the past 12
          months — which, on the free hosted instance, is zero.
        </Section>

        <Section title="Termination">
          You can delete your account at any time from Settings. The operator
          can terminate accounts for abuse, illegal use, or extended inactivity.
          On termination, your personal data is anonymized per the Privacy
          Policy.
        </Section>

        <Section title="Changes">
          Material changes will be noted here with an updated date. Continued
          use after changes implies acceptance.
        </Section>

        <Section title="Governing law">
          These terms are governed by the laws of the operator&apos;s
          jurisdiction unless otherwise noted by the operator on this page.
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
