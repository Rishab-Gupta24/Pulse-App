import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Pulse",
  description: "Daily task & expense tracker",
  applicationName: "Pulse",
  appleWebApp: {
    capable: true,
    title: "Pulse",
    statusBarStyle: "default",
  },
  // Next only emits `mobile-web-app-capable`; older iOS Safari needs the Apple-prefixed tag.
  other: { "apple-mobile-web-app-capable": "yes" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2F2F7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
        {/* Vercel Web Analytics: cookieless page views; only active on Vercel deploys. */}
        <Analytics />
      </body>
    </html>
  );
}
