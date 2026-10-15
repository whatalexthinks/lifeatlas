import type { Metadata } from "@/lib/router/metadata";
import { Providers } from "@/components/shared/providers";
import { appConfig } from "@/lib/config";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  metadataBase: new URL(appConfig.siteUrl),
  title: {
    default: `${brand.name} — A life is made of moments. Keep them close.`,
    template: `%s · ${brand.name}`,
  },
  description:
    "Bring your stories, photographs, voices and favorite memories together in one beautiful, private place — for yourself, someone you love, or your whole family.",
  applicationName: brand.name,
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

// <html>, <head>, viewport/theme-color, fonts and the `js` class live in index.html.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only z-[100] rounded-full bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <Providers>{children}</Providers>
    </>
  );
}
