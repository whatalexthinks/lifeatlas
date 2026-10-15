/** next/navigation replacements on top of React Router. Degrade gracefully outside a router (tests). */
import { useMemo } from "react";
import {
  useInRouterContext,
  useLocation,
  useNavigate,
  useParams as useRouterParams,
} from "react-router-dom";

type NavOptions = { scroll?: boolean };

export class NotFoundSignal extends Error {
  constructor() {
    super("NEXT_NOT_FOUND");
    this.name = "NotFoundSignal";
  }
}
export class RedirectSignal extends Error {
  constructor(public readonly url: string) {
    super(`REDIRECT ${url}`);
    this.name = "RedirectSignal";
  }
}

/** Throws during render; the route boundary renders the 404 page. */
export function notFound(): never {
  throw new NotFoundSignal();
}
/** Throws during render; the route boundary performs a replace navigation. */
export function redirect(url: string): never {
  throw new RedirectSignal(url);
}

export function useRouter() {
  const inRouter = useInRouterContext();
  // Router presence never changes for a mounted component, so the conditional hook is stable.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const navigate = inRouter ? useNavigate() : null;
  return useMemo(
    () => ({
      push: (href: string, opts?: NavOptions) =>
        navigate ? navigate(href, { state: opts?.scroll === false ? { __noScroll: true } : undefined }) : window.history.pushState(null, "", href),
      replace: (href: string, opts?: NavOptions) =>
        navigate
          ? navigate(href, { replace: true, state: opts?.scroll === false ? { __noScroll: true } : undefined })
          : window.history.replaceState(null, "", href),
      back: () => (navigate ? navigate(-1) : window.history.back()),
      forward: () => (navigate ? navigate(1) : window.history.forward()),
      refresh: () => {},
      prefetch: (_href: string) => {},
    }),
    [navigate],
  );
}

export function usePathname(): string {
  const inRouter = useInRouterContext();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return inRouter ? useLocation().pathname : typeof window !== "undefined" ? window.location.pathname : "/";
}

export function useSearchParams(): URLSearchParams {
  const inRouter = useInRouterContext();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const search = inRouter ? useLocation().search : typeof window !== "undefined" ? window.location.search : "";
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): Partial<T> {
  const inRouter = useInRouterContext();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return (inRouter ? useRouterParams() : {}) as Partial<T>;
}
