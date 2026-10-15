import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { editorial } from "./fonts";
import { GeistSans } from "geist/font/sans";
import { Providers } from "@/components/shared/providers";
import { appConfig } from "@/lib/config";
import { brand } from "@/config/brand";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.siteUrl),
  title: {
    default: `${brand.name} — A life is made of moments. Keep them close.`,
    template: `%s · ${brand.name}`,
  },
  description:
    "Bring your stories, photographs, voices and favorite memories together in one beautiful, private place — for yourself, someone you love, or your whole family.",
  applicationName: brand.name,
  // The share image comes from app/opengraph-image.tsx (Next adds og:image automatically).
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: `${brand.name} — A life is made of moments. Keep them close.`,
    description: "Stories, voices, photographs and memories, kept together for the people who matter.",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#1b1a18" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${editorial.variable} ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Progressive enhancement: reveal animations only when JS runs. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a href="#main" className="sr-only z-[100] rounded-full bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
