import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Providers } from "./providers";
import { HyperDXBoot } from "./HyperDXBoot";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-nunito",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lumen.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lumen",
    template: "%s — Lumen",
  },
  description: "A quiet workspace for thinking and writing well",
  openGraph: {
    type: "website",
    siteName: "Lumen",
    title: "Lumen",
    description: "A quiet workspace for thinking and writing well",
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Lumen" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumen",
    description: "A quiet workspace for thinking and writing well",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={nunito.variable} suppressHydrationWarning>
        <HyperDXBoot />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
