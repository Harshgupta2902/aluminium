import type { Metadata } from "next";
import localFont from "next/font/local";
import { getSiteUrl, siteName, siteDescription } from "@/lib/site";
import "./globals.css";

// Self-hosted IBM Plex Sans (woff2 in app/fonts, no Google Fonts).
// Used for everything, including monospace contexts.
const plexSans = localFont({
  variable: "--font-plex-sans",
  display: "swap",
  src: [
    { path: "./fonts/ibm-plex-sans-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-sans-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ibm-plex-sans-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ibm-plex-sans-700.woff2", weight: "700", style: "normal" },
  ],
});

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteUrl();
  return {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Design windows and send quotations in minutes`,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "aluminium windows",
    "uPVC windows",
    "window quotation software",
    "window design software",
    "PDF proposals",
    "window estimation",
    "quotation generator",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName,
    url: "/",
    title: `${siteName} — Design windows and send quotations in minutes`,
    description: siteDescription,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — Design windows and send quotations in minutes`,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
