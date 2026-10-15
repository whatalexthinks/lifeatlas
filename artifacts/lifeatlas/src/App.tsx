import { Component, Suspense, createContext, lazy, useContext, useEffect, useRef, useState, type ComponentType, type ErrorInfo, type ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, useAuth, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useNavigationType, useParams } from "react-router-dom";
import { NotFoundSignal, RedirectSignal } from "@/lib/router/navigation";
import { useMetadata, type Metadata, type MetadataSource } from "@/lib/router/metadata";

import RootLayout, { metadata as rootMeta } from "@/app/layout";
import ErrorPage from "@/app/error";
import NotFound from "@/app/not-found";
import MarketingLayout from "@/app/(marketing)/layout";
import OpsLayout, { metadata as opsMeta } from "@/app/(ops)/layout";
import StudioLayout, { metadata as studioMeta } from "@/app/app/layout";
import StudioLoading from "@/app/app/loading";
import CapsuleLayout from "@/app/app/capsules/[id]/layout";
import CheckoutLayout, { metadata as checkoutMeta } from "@/app/checkout/layout";
import ContributeLayout, { metadata as contributeMeta } from "@/app/contribute/[token]/layout";
import FutureLayout, { metadata as futureMeta } from "@/app/future/layout";
import GiftLayout, { metadata as giftMeta } from "@/app/gift/layout";
import ProofLayout, { metadata as proofMeta } from "@/app/proof/layout";
import ViewerLayout, { metadata as viewerMeta } from "@/app/view/[capsuleId]/layout";
import { Logo } from "@/components/brand/logo";
import type { DemoDatabase } from "@/domain/models";
import { buildSeed, SAMPLE_VERSION, SCHEMA_VERSION } from "@/data/fixtures";
import { withNewFields } from "@/store/migrate";
import { setCloudPersistenceActive, useDemoStore } from "@/store/demo-store";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPublishableKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const clerkAppearance = {
  theme: dark,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#c9b48a",
    colorForeground: "#efece2",
    colorMutedForeground: "#aeb5aa",
    colorDanger: "#c2776a",
    colorBackground: "#172019",
    colorInput: "#101813",
    colorInputForeground: "#efece2",
    colorNeutral: "#39443a",
    fontFamily: "Newsreader, Georgia, serif",
    borderRadius: "0.45rem",
  },
  elements: {
    rootBox: { width: "100%", display: "flex", justifyContent: "center" },
    cardBox: { width: "440px", maxWidth: "calc(100vw - 2rem)", backgroundColor: "#172019", border: "1px solid #303a31", borderRadius: "12px", boxShadow: "none" },
    card: { backgroundColor: "transparent", boxShadow: "none", border: "0" },
    footer: { backgroundColor: "transparent", boxShadow: "none", border: "0" },
    headerTitle: { color: "#efece2", fontFamily: "Newsreader, Georgia, serif", fontWeight: "400" },
    headerSubtitle: { color: "#b5baaf" },
    socialButtonsBlockButtonText: { color: "#efece2" },
    formFieldLabel: { color: "#d8d9cf" },
    footerActionLink: { color: "#d3bf95" },
    footerActionText: { color: "#aeb5aa" },
    dividerText: { color: "#aeb5aa" },
    formButtonPrimary: { backgroundColor: "#c9b48a", color: "#172019", borderRadius: "999px", boxShadow: "none" },
    formFieldInput: { backgroundColor: "#101813", color: "#efece2", border: "1px solid #39443a" },
  },
};

function clerkRelativePath(to: string) {
  const url = new URL(to, window.location.origin);
  let path = url.pathname;
  if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) {
    path = path.slice(basePath.length) || "/";
  }
  return `${path}${url.search}${url.hash}`;
}

function safeRedirectUrl(value: string | null) {
  const relative = value?.startsWith("/") && !value.startsWith("//") ? value : "/app";
  const fullPath = relative === "/" ? (basePath || "/") : `${basePath}${relative}`;
  try {
    return new URL(fullPath, window.location.origin).origin === window.location.origin ? fullPath : `${basePath}/app`;
  } catch {
    return `${basePath}/app` || "/app";
  }
}

type AccountSyncState = {
  status: "ready" | "loading" | "error" | "conflict";
  message?: string;
  retry: () => void;
};

const AccountSyncContext = createContext<AccountSyncState>({
  status: "ready",
  retry: () => undefined,
});

function AccountSyncGate({ children }: { children: ReactNode }) {
  const { status, message, retry } = useContext(AccountSyncContext);
  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center bg-night px-6 text-paper" aria-live="polite">Opening your private capsule workspace…</div>;
  }
  if (status === "error" || status === "conflict") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-night px-6 py-12 text-paper">
        <section className="max-w-lg border border-white/10 bg-forest px-8 py-9 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-brass">Your account</p>
          <h1 className="mt-4 font-serif text-3xl">Your saved capsule needs attention</h1>
          <p className="mt-4 text-sm leading-6 text-paper/70">{message}</p>
          <button className="mt-7 rounded-full bg-brass px-6 py-3 text-sm text-forest" onClick={retry}>
            {status === "conflict" ? "Reload the saved version" : "Try again"}
          </button>
        </section>
      </main>
    );
  }
  return children;
}

function RequireAccount({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  if (!isLoaded) return <div className="min-h-screen bg-night" aria-busy="true" />;
  if (!isSignedIn) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`} replace />;
  }
  return <AccountSyncGate>{children}</AccountSyncGate>;
}

type AccountSnapshotResponse = {
  data: DemoDatabase | null;
  version: number;
  updatedAt: string | null;
};

const ACCOUNT_OWNED_COLLECTIONS = [
  "personas", "people", "relationships", "lifeEvents", "familyGroups", "capsules",
  "memberships", "memories", "media", "transcripts", "places", "assignments",
  "sessions", "invitations", "contributions", "shareGrants", "gifts",
  "futureMessages", "successors", "heirlooms", "printProjects", "checkouts",
  "orders", "subscriptions", "invoices", "refunds", "exportJobs",
  "integrityChecks", "notifications", "auditEvents", "analytics", "supportRequests",
  "promotionRedemptions", "credits", "bookmarks", "questionFavorites",
  "captureDrafts", "letterDrafts", "gatherings",
] as const satisfies readonly (keyof DemoDatabase)[];

function newAccountWorkspace(userId: string, displayName: string, email: string): DemoDatabase {
  const workspace = buildSeed();
  for (const key of ACCOUNT_OWNED_COLLECTIONS) workspace[key] = [] as never;
  workspace.schemaVersion = SCHEMA_VERSION;
  workspace.seededAt = new Date().toISOString();
  workspace.samplesRemoved = true;
  workspace.sampleVersion = SAMPLE_VERSION;
  workspace.account.user = { ...workspace.account.user, id: userId, email };
  workspace.account.profile = {
    ...workspace.account.profile,
    userId,
    displayName,
    givenName: displayName.split(/\s+/)[0] || "You",
    personId: undefined,
  };
  workspace.personas = [{
    id: userId,
    kind: "organizer",
    name: displayName,
    description: "You, the capsule owner.",
    roles: [],
  }];
  workspace.activePersonaId = userId;
  workspace.wizardDraft = null;
  return workspace;
}

async function requestAccountSnapshot(method: "GET" | "PUT", body?: { data: DemoDatabase; version: number }) {
  const response = await fetch("/api/account/snapshot", {
    method,
    credentials: "include",
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = typeof result?.error === "string" ? result.error : "We could not reach your saved capsule workspace.";
    throw Object.assign(new Error(error), { status: response.status });
  }
  return result as AccountSnapshotResponse;
}

function AccountSyncBridge({ children }: { children: ReactNode }) {
  const { isLoaded: authLoaded, isSignedIn, userId } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const [retryCount, setRetryCount] = useState(0);
  const [sync, setSync] = useState<AccountSyncState>({ status: "loading", retry: () => setRetryCount((n) => n + 1) });
  const version = useRef(0);
  const activeUser = useRef<string | null>(null);

  useEffect(() => {
    if (!authLoaded || (isSignedIn && !userLoaded)) {
      setSync({ status: "loading", retry: () => setRetryCount((n) => n + 1) });
      return;
    }
    if (!isSignedIn || !userId || !user) {
      if (activeUser.current) {
        setCloudPersistenceActive(false);
        useDemoStore.setState({ db: buildSeed(), persistence: "indexeddb", saveError: undefined });
      }
      activeUser.current = null;
      version.current = 0;
      setSync({ status: "ready", retry: () => setRetryCount((n) => n + 1) });
      return;
    }

    if (activeUser.current && activeUser.current !== userId) {
      setCloudPersistenceActive(false);
      useDemoStore.setState({ db: buildSeed(), persistence: "indexeddb", saveError: undefined });
      activeUser.current = null;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let saveInFlight = false;
    let saveAgain = false;
    const retry = () => setRetryCount((n) => n + 1);
    const setStatus = (next: Omit<AccountSyncState, "retry">) => {
      if (!cancelled) setSync({ ...next, retry });
    };
    const displayName = user.fullName || user.firstName || user.username || "My capsule";
    const email = user.primaryEmailAddress?.emailAddress ?? "";
    setStatus({ status: "loading" });

    const bootstrap = async () => {
      try {
        const snapshot = await requestAccountSnapshot("GET");
        if (cancelled) return;

        let workspace: DemoDatabase;
        if (snapshot.data) {
          if (!Array.isArray(snapshot.data.capsules) || typeof snapshot.data.schemaVersion !== "number") {
            throw new Error("The saved workspace could not be read safely. Your data has not been changed.");
          }
          workspace = withNewFields(snapshot.data, buildSeed());
          version.current = snapshot.version;
        } else {
          workspace = newAccountWorkspace(userId, displayName, email);
          const created = await requestAccountSnapshot("PUT", { data: workspace, version: 0 });
          version.current = created.version;
        }

        if (cancelled) return;
        setCloudPersistenceActive(true);
        activeUser.current = userId;
        useDemoStore.setState({
          db: workspace,
          hydrated: true,
          persistence: "cloud",
          lastSavedAt: snapshot.updatedAt ?? new Date().toISOString(),
          saveError: undefined,
        });
        setStatus({ status: "ready" });

        const pushLatest = async () => {
          if (cancelled || activeUser.current !== userId) return;
          if (saveInFlight) {
            saveAgain = true;
            return;
          }
          saveInFlight = true;
          saveAgain = false;
          try {
            const current = useDemoStore.getState().db;
            const saved = await requestAccountSnapshot("PUT", { data: current, version: version.current });
            if (cancelled || activeUser.current !== userId) return;
            version.current = saved.version;
            useDemoStore.setState({
              persistence: "cloud",
              lastSavedAt: saved.updatedAt ?? new Date().toISOString(),
              saveError: undefined,
            });
          } catch (error) {
            const status = (error as { status?: number }).status;
            if (status === 409) {
              setStatus({ status: "conflict", message: "This capsule was edited in another session. Reload the saved version before making more changes." });
            } else {
              setStatus({
                status: "error",
                message: `${error instanceof Error ? error.message : "We could not save your changes."} Your last confirmed cloud copy is safe.`,
              });
            }
          } finally {
            saveInFlight = false;
            if (saveAgain && !cancelled && activeUser.current === userId) {
              saveAgain = false;
              timer = setTimeout(() => void pushLatest(), 250);
            }
          }
        };

        const unsubscribe = useDemoStore.subscribe((state, previous) => {
          if (state.db === previous.db || cancelled) return;
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => void pushLatest(), 700);
        });
        return unsubscribe;
      } catch (error) {
        if (cancelled) return;
        const status = (error as { status?: number }).status;
        setStatus({
          status: status === 409 ? "conflict" : "error",
          message: error instanceof Error ? error.message : "We could not open your saved capsule workspace.",
        });
        return undefined;
      }
    };

    let unsubscribe: (() => void) | undefined;
    void bootstrap().then((stop) => {
      unsubscribe = stop;
    });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribe?.();
    };
  }, [authLoaded, isSignedIn, userId, userLoaded, user, retryCount]);

  return <AccountSyncContext.Provider value={sync}>{children}</AccountSyncContext.Provider>;
}

function SignInPage() {
  const location = useLocation();
  const target = new URLSearchParams(location.search).get("redirect_url");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-night px-5 py-12">
      <Logo href={null} tone="light" />
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={safeRedirectUrl(target)} />
    </main>
  );
}

function SignUpPage() {
  const location = useLocation();
  const target = new URLSearchParams(location.search).get("redirect_url");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-night px-5 py-12">
      <Logo href={null} tone="light" />
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} fallbackRedirectUrl={safeRedirectUrl(target)} />
    </main>
  );
}

function ClerkRouterBridge() {
  const navigate = useNavigate();
  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      signInFallbackRedirectUrl={`${basePath}/app`}
      signUpFallbackRedirectUrl={`${basePath}/app`}
      routerPush={(to) => navigate(clerkRelativePath(to))}
      routerReplace={(to) => navigate(clerkRelativePath(to), { replace: true })}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Return to the stories you are keeping." } },
        signUp: { start: { title: "Begin your capsule", subtitle: "Create a private place for the stories you want to keep." } },
      }}
    >
      <AccountSyncBridge>{appRoutes}</AccountSyncBridge>
    </ClerkProvider>
  );
}

type PageModule = { default: ComponentType | (() => void); metadata?: Metadata; generateMetadata?: (params: Record<string, string | undefined>) => Metadata };

/** Lazy page that applies its resolved metadata chain (root → layouts → page) on mount and param change. */
function page(load: () => Promise<PageModule>, layouts: MetadataSource[] = []) {
  const Lazy = lazy(async () => {
    const mod = await load();
    const chain: MetadataSource[] = [rootMeta, ...layouts, mod.generateMetadata ?? mod.metadata];
    const Page = mod.default as ComponentType;
    function WithMetadata() {
      const params = useParams();
      useMetadata(chain, params);
      return <Page />;
    }
    return { default: WithMetadata };
  });
  return <Lazy />;
}

/** Wraps a Next-style `{ children }` layout around the nested route outlet. */
function Layout({ of: L, fallback = null }: { of: ComponentType<{ children: ReactNode }>; fallback?: ReactNode }) {
  return (
    <L>
      <Suspense fallback={fallback}>
        <Outlet />
      </Suspense>
    </L>
  );
}

/** Next scrolls to top (or #hash) on push/replace unless `scroll={false}`. Back/forward keeps the browser's position. */
function ScrollManager() {
  const { pathname, search, hash, state } = useLocation();
  const type = useNavigationType();
  useEffect(() => {
    if (type === "POP") return;
    if ((state as { __noScroll?: boolean } | null)?.__noScroll) return;
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search, hash]);
  return null;
}

function NotFoundView() {
  useMetadata([rootMeta, { robots: { index: false, follow: true } }], {});
  return <NotFound />;
}

type BoundaryState = { error: unknown; key: string };
/** Equivalent of app/error.tsx + app/not-found.tsx + redirect(): rendered inside the root layout. */
class RouteBoundary extends Component<{ resetKey: string; children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null, key: this.props.resetKey };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  static getDerivedStateFromProps(props: { resetKey: string }, state: BoundaryState) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }
  componentDidCatch(error: unknown, info: ErrorInfo) {
    if (!(error instanceof NotFoundSignal) && !(error instanceof RedirectSignal)) console.error(error, info.componentStack);
  }
  render() {
    const { error } = this.state;
    if (error instanceof NotFoundSignal) return <NotFoundView />;
    if (error instanceof RedirectSignal) return <Navigate to={error.url} replace />;
    if (error) return <ErrorPage error={error as Error} retry={() => this.setState({ error: null })} />;
    return this.props.children;
  }
}

function Root() {
  const { pathname } = useLocation();
  return (
    <RootLayout>
      <ScrollManager />
      <RouteBoundary resetKey={pathname}>
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </RouteBoundary>
    </RootLayout>
  );
}

const ops = [opsMeta];
const studio = [studioMeta];

// Built once at module scope so lazy page components keep a stable identity across renders.
const appRoutes = (
    <Routes>
      <Route element={<Root />}>
        <Route path="sign-in/*" element={<SignInPage />} />
        <Route path="sign-up/*" element={<SignUpPage />} />
        {/* (marketing) */}
        <Route element={<Layout of={MarketingLayout} />}>
          <Route index element={page(() => import("@/app/(marketing)/page"))} />
          <Route path="about" element={page(() => import("@/app/(marketing)/about/page"))} />
          <Route path="contact" element={page(() => import("@/app/(marketing)/contact/page"))} />
          <Route path="couples" element={page(() => import("@/app/(marketing)/couples/page"))} />
          <Route path="demo" element={page(() => import("@/app/(marketing)/demo/page"))} />
          <Route path="examples" element={page(() => import("@/app/(marketing)/examples/page"))} />
          <Route path="families" element={page(() => import("@/app/(marketing)/families/page"))} />
          <Route path="faq" element={page(() => import("@/app/(marketing)/faq/page"))} />
          <Route path="gifts" element={page(() => import("@/app/(marketing)/gifts/page"))} />
          <Route path="gifts/build" element={page(() => import("@/app/(marketing)/gifts/build/page"))} />
          <Route path="how-it-works" element={page(() => import("@/app/(marketing)/how-it-works/page"))} />
          <Route path="legacy" element={page(() => import("@/app/(marketing)/legacy/page"))} />
          <Route path="personal" element={page(() => import("@/app/(marketing)/personal/page"))} />
          <Route path="physical-capsules" element={page(() => import("@/app/(marketing)/physical-capsules/page"))} />
          <Route path="pricing" element={page(() => import("@/app/(marketing)/pricing/page"))} />
          <Route path="privacy" element={page(() => import("@/app/(marketing)/privacy/page"))} />
          <Route path="r/:code" element={page(() => import("@/app/(marketing)/r/[code]/page"))} />
          <Route path="support" element={page(() => import("@/app/(marketing)/support/page"))} />
          <Route path="terms" element={page(() => import("@/app/(marketing)/terms/page"))} />
          {/* [...slug] catch-all, also the 404 for any unmatched URL (unknown keys call notFound()). */}
          <Route path="*" element={page(() => import("@/app/(marketing)/[...slug]/page"))} />
        </Route>

        {/* (ops) */}
        <Route path="demo" element={<Layout of={OpsLayout} />}>
          <Route path="control-center" element={page(() => import("@/app/(ops)/demo/control-center/page"), ops)} />
          <Route path="operations" element={page(() => import("@/app/(ops)/demo/operations/page"), ops)} />
          <Route path="style-guide" element={page(() => import("@/app/(ops)/demo/style-guide/page"), ops)} />
        </Route>

        {/* studio */}
        <Route path="app" element={<RequireAccount><Layout of={StudioLayout} fallback={<StudioLoading />} /></RequireAccount>}>
          <Route index element={page(() => import("@/app/app/page"), studio)} />
          <Route path="billing" element={page(() => import("@/app/app/billing/page"), studio)} />
          <Route path="capsules" element={page(() => import("@/app/app/capsules/page"), studio)} />
          <Route path="capsules/new" element={page(() => import("@/app/app/capsules/new/page"), studio)} />
          <Route path="capsules/:id" element={<Layout of={CapsuleLayout} fallback={<StudioLoading />} />}>
            <Route index element={page(() => import("@/app/app/capsules/[id]/page"), studio)} />
            <Route path="chapters" element={page(() => import("@/app/app/capsules/[id]/chapters/page"), studio)} />
            <Route path="edit" element={page(() => import("@/app/app/capsules/[id]/edit/page"), studio)} />
            <Route path="export" element={page(() => import("@/app/app/capsules/[id]/export/page"), studio)} />
            <Route path="gallery" element={page(() => import("@/app/app/capsules/[id]/gallery/page"), studio)} />
            <Route path="map" element={page(() => import("@/app/app/capsules/[id]/map/page"), studio)} />
            <Route path="memories" element={page(() => import("@/app/app/capsules/[id]/memories/page"), studio)} />
            <Route path="people" element={page(() => import("@/app/app/capsules/[id]/people/page"), studio)} />
            <Route path="privacy" element={page(() => import("@/app/app/capsules/[id]/privacy/page"), studio)} />
            <Route path="questions" element={page(() => import("@/app/app/capsules/[id]/questions/page"), studio)} />
            <Route path="timeline" element={page(() => import("@/app/app/capsules/[id]/timeline/page"), studio)} />
            <Route path="voices" element={page(() => import("@/app/app/capsules/[id]/voices/page"), studio)} />
          </Route>
          <Route path="family" element={page(() => import("@/app/app/family/page"), studio)} />
          <Route path="future-messages" element={page(() => import("@/app/app/future-messages/page"), studio)} />
          <Route path="future-messages/new" element={page(() => import("@/app/app/future-messages/new/page"), studio)} />
          <Route path="gather" element={page(() => import("@/app/app/gather/page"), studio)} />
          <Route path="heirlooms" element={page(() => import("@/app/app/heirlooms/page"), studio)} />
          <Route path="heirlooms/book-builder" element={page(() => import("@/app/app/heirlooms/book-builder/page"), studio)} />
          <Route path="heirlooms/capsule-builder" element={page(() => import("@/app/app/heirlooms/capsule-builder/page"), studio)} />
          <Route path="help" element={page(() => import("@/app/app/help/page"), studio)} />
          <Route path="invitations" element={page(() => import("@/app/app/invitations/page"), studio)} />
          <Route path="orders" element={page(() => import("@/app/app/orders/page"), studio)} />
          <Route path="preservation" element={page(() => import("@/app/app/preservation/page"), studio)} />
          <Route path="preservation/successor" element={page(() => import("@/app/app/preservation/successor/page"), studio)} />
          <Route path="referrals" element={page(() => import("@/app/app/referrals/page"), studio)} />
          <Route path="settings" element={page(() => import("@/app/app/settings/page"), studio)} />
          <Route path="together" element={page(() => import("@/app/app/together/page"), studio)} />
        </Route>

        <Route path="checkout" element={<Layout of={CheckoutLayout} />}>
          <Route path="bag" element={page(() => import("@/app/checkout/bag/page"), [checkoutMeta])} />
          <Route path="complete" element={page(() => import("@/app/checkout/complete/page"), [checkoutMeta])} />
          <Route path="preview" element={page(() => import("@/app/checkout/preview/page"), [checkoutMeta])} />
        </Route>

        <Route path="contribute/:token" element={<Layout of={ContributeLayout} />}>
          <Route index element={page(() => import("@/app/contribute/[token]/page"), [contributeMeta])} />
          <Route path="record" element={page(() => import("@/app/contribute/[token]/record/page"), [contributeMeta])} />
        </Route>

        <Route path="future" element={<Layout of={FutureLayout} />}>
          <Route path="open/:token" element={page(() => import("@/app/future/open/[token]/page"), [futureMeta])} />
        </Route>

        <Route path="gift" element={<Layout of={GiftLayout} />}>
          <Route path=":token" element={page(() => import("@/app/gift/[token]/page"), [giftMeta])} />
          <Route path=":token/begin" element={page(() => import("@/app/gift/[token]/begin/page"), [giftMeta])} />
        </Route>

        <Route path="proof" element={<Layout of={ProofLayout} />}>
          <Route path="book/:id" element={page(() => import("@/app/proof/book/[id]/page"), [proofMeta])} />
          <Route path="box/:id" element={page(() => import("@/app/proof/box/[id]/page"), [proofMeta])} />
        </Route>

        <Route path="view/:capsuleId" element={<Layout of={ViewerLayout} />}>
          <Route index element={page(() => import("@/app/view/[capsuleId]/page"), [viewerMeta])} />
          <Route path="letters" element={page(() => import("@/app/view/[capsuleId]/letters/page"), [viewerMeta])} />
          <Route path="map" element={page(() => import("@/app/view/[capsuleId]/map/page"), [viewerMeta])} />
          <Route path="photos" element={page(() => import("@/app/view/[capsuleId]/photos/page"), [viewerMeta])} />
          <Route path="stories" element={page(() => import("@/app/view/[capsuleId]/stories/page"), [viewerMeta])} />
          <Route path="stories/:memoryId" element={page(() => import("@/app/view/[capsuleId]/stories/[memoryId]/page"), [viewerMeta])} />
          <Route path="timeline" element={page(() => import("@/app/view/[capsuleId]/timeline/page"), [viewerMeta])} />
          <Route path="voices" element={page(() => import("@/app/view/[capsuleId]/voices/page"), [viewerMeta])} />
        </Route>
      </Route>
    </Routes>
);

function App() {
  return (
    <BrowserRouter basename={basePath || "/"}>
      <ClerkRouterBridge />
    </BrowserRouter>
  );
}

export default App;
