import * as React from "react";
import { Link as RouterLink, useInRouterContext } from "react-router-dom";

type Href = string | { pathname?: string; query?: Record<string, string | number | undefined>; hash?: string };

export type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: Href;
  replace?: boolean;
  /** Next-only props: consumed here, never forwarded to the DOM. */
  scroll?: boolean;
  prefetch?: boolean | null | "auto";
  shallow?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
  locale?: string | false;
  external?: boolean;
};

export function hrefToString(href: Href): string {
  if (typeof href === "string") return href;
  const qs = href.query
    ? new URLSearchParams(Object.entries(href.query).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()
    : "";
  return `${href.pathname ?? ""}${qs ? `?${qs}` : ""}${href.hash ? `#${href.hash.replace(/^#/, "")}` : ""}`;
}

const isExternal = (href: string) => /^([a-z][a-z\d+.-]*:|\/\/)/i.test(href) || href.startsWith("#");

/** next/link replacement. Falls back to a plain <a> outside a router (standalone component tests). */
const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, replace, scroll, prefetch: _prefetch, shallow: _shallow, passHref: _passHref, legacyBehavior: _legacy, locale: _locale, external: _external, ...rest },
  ref,
) {
  const inRouter = useInRouterContext();
  const to = hrefToString(href);
  if (!inRouter || isExternal(to)) return <a ref={ref} href={to} {...rest} />;
  return <RouterLink ref={ref} to={to} replace={replace} state={scroll === false ? { __noScroll: true } : undefined} {...rest} />;
});

export default Link;
