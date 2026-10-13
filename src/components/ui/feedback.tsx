"use client";

import * as React from "react";
import { create } from "zustand";
import { AlertTriangle, CheckCircle2, Info, Loader2, MonitorSmartphone, X } from "lucide-react";
import { cn, uid } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

type ToastTone = "success" | "info" | "warning" | "error";
interface ToastItem {
  id: string;
  title: string;
  body?: string;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
}

const useToasts = create<{ items: ToastItem[]; push: (t: Omit<ToastItem, "id">) => void; dismiss: (id: string) => void }>((set) => ({
  items: [],
  push: (t) => {
    const id = uid("toast");
    set((s) => ({ items: [...s.items.slice(-3), { ...t, id }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((x) => x.id !== id) })), t.tone === "error" ? 9000 : 5500);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (title: string, body?: string, action?: ToastItem["action"]) => useToasts.getState().push({ title, body, tone: "success", action }),
  info: (title: string, body?: string, action?: ToastItem["action"]) => useToasts.getState().push({ title, body, tone: "info", action }),
  warning: (title: string, body?: string, action?: ToastItem["action"]) => useToasts.getState().push({ title, body, tone: "warning", action }),
  error: (title: string, body?: string, action?: ToastItem["action"]) => useToasts.getState().push({ title, body, tone: "error", action }),
};

const toneIcon: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 className="size-5 text-[#9fd0ae]" />,
  info: <Info className="size-5 text-[#a9c3d3]" />,
  warning: <AlertTriangle className="size-5 text-[#e0c27e]" />,
  error: <AlertTriangle className="size-5 text-[#e59a8f]" />,
};

export function Toaster() {
  const items = useToasts((s) => s.items);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[90] flex flex-col items-center gap-2 px-4 md:bottom-6 md:right-6 md:left-auto md:items-end">
      {items.map((t) => (
        <div
          key={t.id}
          role={t.tone === "error" ? "alert" : "status"}
          className="pointer-events-auto flex w-full max-w-sm animate-[fade-up_320ms_var(--ease-out)] items-start gap-3 rounded-[16px] bg-[#1b221e] px-4 py-3.5 text-[#eee9de] shadow-[0_20px_50px_-20px_rgb(0_0_0/0.6)] ring-1 ring-white/5"
        >
          <span className="mt-0.5">{toneIcon[t.tone]}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.9375rem] font-medium leading-snug">{t.title}</p>
            {t.body ? <p className="mt-0.5 text-[0.875rem] leading-snug text-[#bdb7aa]">{t.body}</p> : null}
            {t.action ? (
              <button
                className="mt-2 text-[0.875rem] font-medium text-[#d2bb93] underline underline-offset-4"
                onClick={() => {
                  t.action!.onClick();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            ) : null}
          </div>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-mr-1 grid size-7 place-items-center rounded-full text-[#8f8a80] hover:bg-white/10 hover:text-white">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status & badges                                                     */
/* ------------------------------------------------------------------ */

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info" | "demo" | "brand";

const toneClass: Record<StatusTone, string> = {
  neutral: "bg-ivory text-ink-2 ring-line",
  success: "bg-success-soft text-success ring-success/20",
  warning: "bg-warning-soft text-warning ring-warning/20",
  danger: "bg-danger-soft text-danger ring-danger/20",
  info: "bg-info-soft text-info ring-info/20",
  demo: "bg-brass-soft text-brass-ink ring-brass/30",
  brand: "bg-evergreen-soft text-evergreen ring-evergreen/20",
};

export function Badge({ tone = "neutral", children, className, dot }: { tone?: StatusTone; children: React.ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[0.75rem] font-medium ring-1 ring-inset", toneClass[tone], className)}>
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

/**
 * The honest, contextual demo notice used at transactional moments.
 * Calm and precise — never a giant banner on emotional pages.
 */
export function DemoNotice({
  children,
  title,
  className,
  tone = "demo",
  icon,
  compact,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
  tone?: "demo" | "warning" | "info";
  icon?: React.ReactNode;
  compact?: boolean;
}) {
  const tones = {
    demo: "border-brass/35 bg-brass-soft/70 text-ink-2",
    warning: "border-warning/30 bg-warning-soft text-ink-2",
    info: "border-info/25 bg-info-soft text-ink-2",
  };
  return (
    <div role="note" className={cn("flex items-start gap-3 rounded-[14px] border", compact ? "px-3.5 py-2.5" : "px-4 py-3.5", tones[tone], className)}>
      <span className={cn("mt-0.5 shrink-0", tone === "warning" ? "text-warning" : tone === "info" ? "text-info" : "text-brass-ink")}>{icon ?? <MonitorSmartphone className="size-[18px]" />}</span>
      <div className={cn("min-w-0 leading-snug", compact ? "text-[0.8125rem]" : "text-[0.9rem]")}>
        {title ? <p className="font-semibold text-ink">{title}</p> : null}
        <div className={title ? "mt-0.5" : undefined}>{children}</div>
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-2 text-ink-3", className)}>
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-[20px] border border-dashed border-line-strong bg-surface/40 px-6 py-14 text-center", className)}>
      {icon ? <div className="mb-5 grid size-14 place-items-center rounded-full bg-ivory text-evergreen">{icon}</div> : null}
      <h3 className="font-serif text-[1.6rem] leading-tight">{title}</h3>
      {body ? <div className="mx-auto mt-2 max-w-md text-[0.9875rem] leading-relaxed text-ink-3">{body}</div> : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({ value, max = 100, label, className }: { value: number; max?: number; label: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-line", className)} role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-evergreen transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-line-strong bg-surface px-1.5 font-mono text-[0.75rem] text-ink-2">{children}</kbd>;
}
