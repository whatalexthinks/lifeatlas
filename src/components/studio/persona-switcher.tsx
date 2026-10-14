"use client";

import * as React from "react";
import { Popover } from "radix-ui";
import { Check, ChevronsUpDown, ShieldAlert } from "lucide-react";
import { usePersona, useDb } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { cn, initials } from "@/lib/utils";
import { toast } from "@/components/ui/feedback";

const kindLabel = { organizer: "Organizer", storyteller: "Storyteller", contributor: "Contributor", viewer: "Viewer", operations: "Operations" } as const;

/** Demo identity switcher. Explicitly NOT authentication. */
export function PersonaSwitcher({ compact = false, align = "start", side = "bottom", tone = "paper" }: { compact?: boolean; align?: "start" | "end"; side?: "top" | "bottom" | "right"; tone?: "paper" | "night" }) {
  const persona = usePersona();
  const personas = useDb((d) => d.personas);
  const [open, setOpen] = React.useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={cn(
            "group flex items-center gap-2.5 rounded-full text-left transition-colors",
            compact ? "p-1" : "w-full py-1.5 pl-1.5 pr-3",
            tone === "night" ? "hover:bg-white/10" : "hover:bg-ivory",
          )}
          aria-label={`Demo identity: ${persona.name}. Switch identity`}
        >
          <Avatar name={persona.name} kind={persona.kind} />
          {!compact ? (
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate text-[0.875rem] font-medium leading-tight", tone === "night" ? "text-night-ink" : "text-ink")}>{persona.name}</span>
              <span className={cn("block text-[0.75rem] leading-tight", tone === "night" ? "text-night-ink-3" : "text-ink-3")}>Viewing as {kindLabel[persona.kind].toLowerCase()} · demo</span>
            </span>
          ) : null}
          {!compact ? <ChevronsUpDown className="size-4 shrink-0 text-ink-4" /> : null}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align={align} side={side} sideOffset={8} className="z-[85] w-[320px] rounded-[18px] border border-line bg-surface p-2 shadow-lg data-[state=open]:animate-[fade-in_160ms_ease-out]">
          <div className="flex items-start gap-2.5 rounded-[12px] bg-brass-soft/70 px-3 py-2.5 text-[0.8125rem] leading-snug text-ink-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-brass-ink" />
            <span>
              <strong className="font-semibold text-ink">Demo identities.</strong> Switching shows what each person would see. It is not a sign-in and protects nothing.
            </span>
          </div>
          <ul className="mt-1.5" role="listbox" aria-label="Demo identities">
            {personas.map((p) => (
              <li key={p.id}>
                <button
                  role="option"
                  aria-selected={p.id === persona.id}
                  onClick={async () => {
                    await services().auth.switchPersona(p.id);
                    setOpen(false);
                    toast.info(`Now viewing as ${p.name}`, "Simulated identity — nothing is signed in or secured.");
                  }}
                  className="flex w-full items-center gap-3 rounded-[12px] px-2.5 py-2.5 text-left hover:bg-ivory"
                >
                  <Avatar name={p.name} kind={p.kind} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9rem] font-medium">{p.name}</span>
                    <span className="block text-[0.78rem] leading-snug text-ink-3">{p.description}</span>
                  </span>
                  {p.id === persona.id ? <Check className="size-4 text-evergreen" /> : null}
                </button>
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

const kindColor = { organizer: "bg-evergreen text-on-evergreen", storyteller: "bg-terracotta text-white", contributor: "bg-slate text-white", viewer: "bg-[#6b665f] text-white", operations: "bg-ink text-paper" } as const;

export function Avatar({ name, kind, size = "md", className }: { name: string; kind?: keyof typeof kindColor; size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-medium",
        size === "sm" ? "size-7 text-[0.6875rem]" : size === "lg" ? "size-12 text-[1rem]" : "size-9 text-[0.8125rem]",
        kind ? kindColor[kind] : "bg-linen text-ink-2",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
