/**
 * Client-side replacement for Next's Metadata API.
 * Pages and layouts keep exporting `metadata` (or a sync `generateMetadata(params)`);
 * the router resolves the chain root → layouts → page and writes it to <head> on navigation.
 */
import { useEffect } from "react";

type Robots = { index?: boolean; follow?: boolean } | string;
type Title = string | { default?: string; template?: string; absolute?: string };

export type Metadata = {
  metadataBase?: URL;
  title?: Title;
  description?: string;
  applicationName?: string;
  openGraph?: { type?: string; siteName?: string; title?: string; description?: string; [key: string]: unknown };
  twitter?: { card?: string; [key: string]: unknown };
  icons?: { icon?: string };
  formatDetection?: Record<string, boolean>;
  robots?: Robots;
  alternates?: { canonical?: string };
  [key: string]: unknown;
};

export type Viewport = {
  themeColor?: { media: string; color: string }[] | string;
  width?: string;
  initialScale?: number;
  viewportFit?: string;
};

export type RouteParams = Record<string, string | undefined>;
export type MetadataSource = Metadata | ((params: RouteParams) => Metadata) | undefined;

const applyTemplate = (template: string | undefined, value: string) => (template ? template.replace("%s", value) : value);

export function resolveMetadata(chain: MetadataSource[], params: RouteParams) {
  let template: string | undefined;
  let title: string | undefined;
  let description: string | undefined;
  let robots: Robots | undefined;
  let canonical: string | undefined;
  let base: URL | undefined;
  let openGraph: Metadata["openGraph"] = {};
  for (const source of chain) {
    const m = typeof source === "function" ? source(params) : source;
    if (!m) continue;
    if (m.metadataBase) base = m.metadataBase;
    if (typeof m.title === "string") title = applyTemplate(template, m.title);
    else if (m.title) {
      title = m.title.absolute ?? (m.title.default !== undefined ? applyTemplate(template, m.title.default) : title);
      if (m.title.template) template = m.title.template;
    }
    if (m.description !== undefined) description = m.description;
    if (m.robots !== undefined) robots = m.robots;
    // Canonical belongs to the segment that declared it (Next does not inherit it into children).
    canonical = m.alternates?.canonical;
    if (m.openGraph) openGraph = { ...openGraph, ...m.openGraph };
  }
  return { title, description, robots, canonical, base, openGraph };
}

function setMeta(attr: "name" | "property", key: string, content: string | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (content === undefined) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string | undefined) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

const robotsString = (r: Robots | undefined) =>
  r === undefined ? undefined : typeof r === "string" ? r : `${r.index === false ? "noindex" : "index"}, ${r.follow === false ? "nofollow" : "follow"}`;

export function applyMetadata(chain: MetadataSource[], params: RouteParams) {
  const m = resolveMetadata(chain, params);
  if (m.title) document.title = m.title;
  setMeta("name", "description", m.description);
  setMeta("name", "robots", robotsString(m.robots));
  setMeta("property", "og:title", m.openGraph?.title ?? m.title);
  setMeta("property", "og:description", m.openGraph?.description ?? m.description);
  setMeta("property", "og:site_name", m.openGraph?.siteName);
  setMeta("property", "og:type", m.openGraph?.type);
  setCanonical(m.canonical ? new URL(m.canonical, m.base ?? window.location.origin).toString() : undefined);
}

export function useMetadata(chain: MetadataSource[], params: RouteParams) {
  const key = JSON.stringify(params);
  useEffect(() => {
    applyMetadata(chain, params);
    // chain is static per route; params serialised for stability
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
