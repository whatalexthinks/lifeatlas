import { Check, ChevronDown, Minus, X } from "lucide-react";
import type { FutureMessage } from "@/domain/models";
import { deliveryLadder, ladderSummary, type LadderState } from "@/domain/future-ladder";
import { cn } from "@/lib/utils";

const marker: Record<LadderState, { className: string; icon: React.ReactNode; spoken: string }> = {
  done: { className: "border-evergreen bg-evergreen text-on-evergreen", icon: <Check className="size-3.5" aria-hidden />, spoken: "Done" },
  later: { className: "border-line-strong bg-surface", icon: null, spoken: "Not yet" },
  unavailable: { className: "border-dashed border-line-strong bg-surface text-ink-3", icon: <Minus className="size-3.5" aria-hidden />, spoken: "Not available yet" },
  failed: { className: "border-danger bg-danger text-white", icon: <X className="size-3.5" aria-hidden />, spoken: "Failed" },
  canceled: { className: "border-line-strong bg-paper text-ink-3", icon: <X className="size-3.5" aria-hidden />, spoken: "Canceled" },
};

/**
 * Every step a letter would pass through, each marked by what has really happened. Steps that
 * need a service this build doesn't have say so in words, not only with a different mark.
 */
export function DeliveryLadder({ message, className }: { message: Pick<FutureMessage, "status">; className?: string }) {
  const steps = deliveryLadder(message);
  return (
    <ol className={cn("space-y-0", className)} aria-label="Where this letter is">
      {steps.map((s, i) => (
        <li key={s.key} className="relative flex gap-3 pb-4 last:pb-0">
          {i < steps.length - 1 ? <span aria-hidden className={cn("absolute top-6 left-[11px] h-[calc(100%-1.25rem)] w-px", s.state === "done" ? "bg-evergreen" : "bg-line-strong")} /> : null}
          <span className={cn("relative mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border", marker[s.state].className)}>{marker[s.state].icon}</span>
          <span className="min-w-0">
            <span className={cn("block text-[0.9375rem] font-medium", s.state === "unavailable" && "text-ink-2")}>
              {s.label}
              <span className="sr-only"> — {marker[s.state].spoken}.</span>
            </span>
            <span className="block text-[0.8125rem] leading-snug text-ink-3">{s.note}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** The ladder folded into one honest sentence, for letter cards. */
export function DeliveryLadderSummary({ message, className }: { message: Pick<FutureMessage, "status">; className?: string }) {
  const s = ladderSummary(message);
  return (
    <details className={cn("group rounded-[14px] border border-line bg-paper/60 px-4 py-3", className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[0.875rem] [&::-webkit-details-marker]:hidden">
        <span>
          <span className="text-ink-3">
            Step {s.position} of {s.total} ·{" "}
          </span>
          <span className="font-medium">{s.current}.</span> <span className="text-ink-2">{s.caveat}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-ink-3 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
      </summary>
      <DeliveryLadder message={message} className="mt-4" />
    </details>
  );
}
