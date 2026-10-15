import { Component, Suspense, lazy, useEffect, type ComponentType, type ErrorInfo, type ReactNode } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigationType, useParams } from "react-router-dom";
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
        <Route path="app" element={<Layout of={StudioLayout} fallback={<StudioLoading />} />}>
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
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
      {appRoutes}
    </BrowserRouter>
  );
}

export default App;
