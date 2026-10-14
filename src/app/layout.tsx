import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { editorial } from "./fonts";
import { GeistSans } from "geist/font/sans";
import { Providers } from "@/components/shared/providers";
import { appConfig } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.siteUrl),
  title: {
    default: "LifeAtlas — Every life has a story worth keeping",
    template: "%s · LifeAtlas",
  },
  description:
    "Save their voice. Gather their photographs. Remember the places that shaped them. Create a private family archive to revisit and pass down.",
  applicationName: "LifeAtlas",
  // The share image comes from app/opengraph-image.tsx (Next adds og:image automatically).
  openGraph: {
    type: "website",
    siteName: "LifeAtlas",
    title: "LifeAtlas — A whole life. In their words.",
    description: "A private family archive of voices, photographs, places and letters.",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6f1" },
    { media: "(prefers-color-scheme: dark)", color: "#131815" },
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
