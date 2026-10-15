"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { useRouter } from "@/lib/router/navigation";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/feedback";
import { useDb, useHydrated } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { cn } from "@/lib/utils";

/** Puts a ready-to-buy product in the bag and goes there. */
export function AddToBagButton({ productId, children, variant = "primary", className }: { productId: string; children: React.ReactNode; variant?: "primary" | "secondary"; className?: string }) {
  const router = useRouter();
  // Wait for saved data to load, or the bag it adds to would be replaced a moment later.
  const hydrated = useHydrated();
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      variant={variant}
      className={className}
      loading={busy}
      disabled={!hydrated}
      leading={<ShoppingBag className="size-4" />}
      onClick={async () => {
        setBusy(true);
        const r = await services().billing.addToCart({ productId, quantity: 1, extrasAmount: 0 });
        setBusy(false);
        if (r.status === "ok") router.push("/checkout/bag");
        else toast.error("Couldn't add it to your bag", r.status === "error" ? r.message : undefined);
      }}
    >
      {children}
    </Button>
  );
}

/** "Bag · 2" in the header, shown only once something is in it. */
export function BagLink({ className }: { className?: string }) {
  const hydrated = useHydrated();
  const count = useDb((d) => d.cart.lines.reduce((s, l) => s + l.quantity, 0));
  if (!hydrated || !count) return null;
  return (
    <Link href="/checkout/bag" aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`} className={cn("inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-medium text-ink-2 hover:text-ink", className)}>
      <ShoppingBag className="size-4" aria-hidden />
      <span aria-hidden>Bag</span>
      <span aria-hidden className="rounded-full bg-ink px-1.5 text-[0.6875rem] leading-5 text-paper tabular-nums">
        {count}
      </span>
    </Link>
  );
}
