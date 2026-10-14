import type { MetadataRoute } from "next";
import { marketingPages } from "@/data/marketing-pages";
import { appConfig } from "@/lib/config";

/** Public information pages only. Private, studio and demo routes are never listed. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = appConfig.siteUrl.replace(/\/$/, "");
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    ...Object.keys(marketingPages).map((slug) => ({
      url: `${base}/${slug}`,
      changeFrequency: "monthly" as const,
      priority: ["privacy", "terms", "data-retention", "accessibility"].includes(slug) ? 0.3 : 0.7,
    })),
  ];
}
