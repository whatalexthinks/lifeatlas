"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Reveal-on-scroll. Respects reduced motion via CSS (.reveal is static there). */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options: { once?: boolean; rootMargin?: string } = {}) {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);
  const { once = true, rootMargin = "0px 0px -8% 0px" } = options;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // Very old browsers: show everything on the next frame.
      const id = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          if (once) io.disconnect();
        } else if (!once) setRevealed(false);
      },
      { rootMargin, threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, rootMargin]);
  return { ref, revealed };
}

function subscribeMedia(query: string) {
  return (cb: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  };
}

const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = subscribeMedia(reducedQuery);

/** True when the device or the in-app setting asks for reduced motion. False during server render. */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(reducedQuery).matches || document.documentElement.dataset.motion === "reduced",
    () => false,
  );
}

/** Live media-query match. False during server render. */
export function useMediaQuery(query: string) {
  const subscribe = subscribeFor(query);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

/** One stable subscribe function per query, so React doesn't resubscribe on every render. */
const subscribers = new Map<string, (cb: () => void) => () => void>();
function subscribeFor(query: string) {
  let sub = subscribers.get(query);
  if (!sub) {
    sub = subscribeMedia(query);
    subscribers.set(query, sub);
  }
  return sub;
}
