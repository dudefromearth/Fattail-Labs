import type { Metadata } from "next";
import Script from "next/script";
import AppChrome from "@/components/AppChrome";
import { MEMBER_SETTINGS_BOOT_SCRIPT } from "@/lib/memberSettings";
import "./globals.css";

export const metadata: Metadata = {
  // Fail-loud base URL (SEO spec v1.0): relative OG images and canonicals
  // resolve against this. Missing env breaks the build, never the crawl.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  title: {
    default: "FatTail Labs",
    template: "%s — FatTail Labs",
  },
  description:
    "Convex options trading education: courses, live sessions, and resources. First step: stop the bleeding.",
  openGraph: {
    siteName: "FatTail Labs",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Human Interface Spec v1.0: system / SF Pro stack via tokens — no webfont in v1.
  return (
    <html lang="en" className="h-full antialiased" data-tint="emerald">
      <body className="flex min-h-full flex-col">
        <Script
          id="ftl-member-settings-boot"
          strategy="beforeInteractive"
        >
          {MEMBER_SETTINGS_BOOT_SCRIPT}
        </Script>
        {/* Sitewide entity (SEO spec v1.3) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "FatTail Labs",
              url: process.env.NEXT_PUBLIC_SITE_URL,
              founder: { "@type": "Person", name: "Ernie Varitimos" },
              sameAs: [
                "https://www.youtube.com/@0dte",
                "https://0-dte.com",
                "https://fattail.ai",
              ],
            }),
          }}
        />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
