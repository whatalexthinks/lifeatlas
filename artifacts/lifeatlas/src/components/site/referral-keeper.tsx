"use client";

import * as React from "react";
import { Check } from "lucide-react";

const KEY = "lifeatlas.referral";
const UNAVAILABLE = "\u0000unavailable";

/** Browser storage as a tiny external store, so the component reads it without effects. */
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
function read() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return UNAVAILABLE;
  }
}
function write(value: string | null) {
  try {
    if (value === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, value);
  } catch {
    // Storage is blocked; read() reports it.
  }
  notify();
}

/**
 * Remembers a friend's referral code on this device so checkout can apply their offer.
 * Storage can be unavailable (private windows, blocked site data), then we say so plainly.
 */
export function ReferralKeeper({ code }: { code: string }) {
  const stored = React.useSyncExternalStore(subscribe, read, () => undefined);
  const [forgotten, setForgotten] = React.useState(false);
  React.useEffect(() => {
    if (!forgotten) write(code);
  }, [code, forgotten]);

  // Nothing to say until the browser has answered, or while the code is being written.
  if (stored === undefined || (!forgotten && stored !== code && stored !== UNAVAILABLE)) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.9375rem]" role="status">
      {stored === UNAVAILABLE ? (
        <span className="text-ink-2">This browser won&rsquo;t let us remember the code. Type {code} at checkout instead.</span>
      ) : forgotten ? (
        <span className="text-ink-2">The code has been forgotten on this device. You can still type it at checkout.</span>
      ) : (
        <>
          <span className="inline-flex items-center gap-2 text-ink-2">
            <Check className="size-4 text-evergreen" aria-hidden /> Code {code} is remembered on this device and applied at checkout.
          </span>
          <button
            type="button"
            onClick={() => {
              setForgotten(true);
              write(null);
            }}
            className="min-h-11 font-medium underline underline-offset-4"
          >
            Forget it
          </button>
        </>
      )}
    </div>
  );
}
