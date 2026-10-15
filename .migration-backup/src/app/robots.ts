import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config";

/** Family archives and private links must never be crawled. */
export default function robots(): MetadataRoute.Robots {
  const base = appConfig.siteUrl.replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/view", "/contribute", "/gift/", "/future", "/checkout", "/demo", "/proof", "/r/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
