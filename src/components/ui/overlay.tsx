"use client";

import * as React from "react";
import { Dialog as RD } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const DialogRoot = RD.Root;
export const DialogTrigger = RD.Trigger;
export const DialogClose = RD.Close;

/** Centered modal on desktop, bottom sheet on mobile. Focus-trapped, Esc to close. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  hideTitle,
  className,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  hideTitle?: boolean;
  className?: string;
}) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-[80] bg-[rgb(18_23_20/0.45)] backdrop-blur-[3px] data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <RD.Content
          className={cn(
            "fixed z-[81] flex max-h-[92dvh] flex-col overflow-hidden bg-surface text-ink shadow-lg outline-none",
            "inset-x-0 bottom-0 rounded-t-[24px] data-[state=open]:animate-[sheet-up_320ms_var(--ease-out)]",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[24px] sm:data-[state=open]:animate-[fade-up_260ms_var(--ease-out)]",
            size === "sm" && "sm:max-w-md",
            size === "md" && "sm:max-w-xl",
            size === "lg" && "sm:max-w-3xl",
            size === "xl" && "sm:max-w-5xl",
            className,
          )}
        >
          <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden />
          <div className={cn("flex items-start justify-between gap-4 px-6 pb-2 pt-5 sm:px-8 sm:pt-7", hideTitle && "sr-only")}>
            <div className="min-w-0">
              <RD.Title className="font-serif text-[1.75rem] leading-tight tracking-[-0.015em]">{title}</RD.Title>
              {description ? <RD.Description className="mt-1.5 text-[0.9375rem] text-ink-3">{description}</RD.Description> : <RD.Description className="sr-only">Dialog</RD.Description>}
            </div>
            <RD.Close asChild>
              <button className="-mr-2 grid size-10 shrink-0 place-items-center rounded-full text-ink-3 transition-colors hover:bg-ivory hover:text-ink" aria-label="Close">
                <X className="size-5" />
              </button>
            </RD.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 sm:px-8">{children}</div>
          {footer ? <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line bg-paper/60 px-6 py-4 safe-bottom sm:px-8">{footer}</div> : null}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

/** Side panel (drawer) for detail editing. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "right",
  width = "md",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  side?: "right" | "left";
  width?: "md" | "lg";
}) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-[80] bg-[rgb(18_23_20/0.35)] backdrop-blur-[2px] data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <RD.Content
          className={cn(
            "fixed inset-y-0 z-[81] flex w-full flex-col bg-surface shadow-lg outline-none",
            side === "right" ? "right-0" : "left-0",
            width === "md" ? "sm:max-w-lg" : "sm:max-w-2xl",
            "data-[state=open]:animate-[fade-in_200ms_ease-out]",
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
            <div className="min-w-0">
              <RD.Title className="font-serif text-[1.6rem] leading-tight">{title}</RD.Title>
              {description ? <RD.Description className="mt-1 text-[0.9375rem] text-ink-3">{description}</RD.Description> : <RD.Description className="sr-only">Panel</RD.Description>}
            </div>
            <RD.Close asChild>
              <button className="-mr-2 grid size-10 place-items-center rounded-full text-ink-3 hover:bg-ivory hover:text-ink" aria-label="Close">
                <X className="size-5" />
              </button>
            </RD.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>
          {footer ? <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line bg-paper/60 px-6 py-4 safe-bottom">{footer}</div> : null}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  tone = "default",
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  tone?: "default" | "danger";
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "destructive" : "primary"} loading={loading} onClick={() => void onConfirm()}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-[1rem] leading-relaxed text-ink-2">{body}</div>
    </Dialog>
  );
}
