import type { MetadataRoute } from "next";
import { marketingPages } from "@/data/marketing-pages";
import { appConfig } from "@/lib/config";

/** Pages with their own route. Template pages come from marketingPages. */
const dedicated = ["how-it-works", "couples", "families", "personal", "legacy", "gifts", "physical-capsules", "pricing", "examples", "faq", "about", "support", "contact", "privacy", "terms"];
const quiet = new Set(["privacy", "terms", "data-retention", "accessibility", "contact", "support"]);

/** Public information pages only. Private, studio, demo and referral routes are never listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = appConfig.siteUrl.replace(/\/$/, "");
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    ...[...dedicated, ...Object.keys(marketingPages)].map((slug) => ({
      url: `${base}/${slug}`,
      changeFrequency: "monthly" as const,
      priority: quiet.has(slug) ? 0.3 : 0.7,
    })),
  ];
}
