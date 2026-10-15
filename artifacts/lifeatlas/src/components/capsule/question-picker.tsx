"use client";

import * as React from "react";
import { Check, Search } from "lucide-react";
import type { Question } from "@/domain/models";
import { Dialog } from "@/components/ui/overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useDb } from "@/hooks/use-data";
import { questionCategories } from "@/data/prompts/questions";
import { cn } from "@/lib/utils";

/** Browse and choose from the authored library + custom questions. */
export function QuestionPicker({
  open,
  onOpenChange,
  selected,
  onConfirm,
  multiple = true,
  max = 12,
  title = "Choose questions",
  answeredIds = [],
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selected: string[];
  onConfirm: (ids: string[]) => void;
  multiple?: boolean;
  max?: number;
  title?: string;
  answeredIds?: string[];
}) {
  const questions = useDb((d) => d.questions);
  const [picked, setPicked] = React.useState<string[]>(selected);
  const [term, setTerm] = React.useState("");
  const [category, setCategory] = React.useState<string>("All");

  // Start from the caller's selection each time the picker opens (React's "adjust state on prop change" pattern).
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPicked(selected);
  }

  const cats = ["All", ...questionCategories, ...(questions.some((q) => q.custom) ? ["Your questions"] : [])];
  const list = questions.filter((q) => {
    if (category === "Your questions" && !q.custom) return false;
    if (category !== "All" && category !== "Your questions" && q.category !== category) return false;
    if (term.trim() && !q.text.toLowerCase().includes(term.trim().toLowerCase())) return false;
    return true;
  });

  const toggle = (q: Question) => {
    if (!multiple) {
      setPicked([q.id]);
      return;
    }
    setPicked((p) => (p.includes(q.id) ? p.filter((x) => x !== q.id) : p.length >= max ? p : [...p, q.id]));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={multiple ? `${picked.length} selected · up to ${max}` : "Pick one question to ask"}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm(picked);
              onOpenChange(false);
            }}
            disabled={!picked.length}
          >
            {multiple ? `Use ${picked.length} ${picked.length === 1 ? "question" : "questions"}` : "Ask this question"}
          </Button>
        </>
      }
    >
      <div className="sticky top-0 z-10 -mx-1 space-y-3 bg-surface px-1 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-4" />
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder={`Search ${questions.length} questions`} className="pl-10" aria-label="Search questions" />
        </div>
        <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn("h-8 shrink-0 rounded-full border px-3 text-[0.8125rem] font-medium", category === c ? "border-evergreen bg-evergreen text-on-evergreen" : "border-line-strong text-ink-2 hover:border-ink-3")}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <ul className="space-y-1.5">
        {list.map((q) => {
          const on = picked.includes(q.id);
          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => toggle(q)}
                aria-pressed={on}
                className={cn("flex w-full items-start gap-3 rounded-[14px] border px-4 py-3 text-left transition-colors", on ? "border-evergreen bg-evergreen-soft/60" : "border-transparent hover:bg-ivory")}
              >
                <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border", on ? "border-evergreen bg-evergreen text-paper" : "border-line-strong")}>{on ? <Check className="size-3" strokeWidth={3} /> : null}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-[1.15rem] leading-snug">{q.text}</span>
                  <span className="mt-0.5 block text-[0.75rem] text-ink-3">
                    {q.custom ? "Your question" : q.category}
                    {answeredIds.includes(q.id) ? " · already answered" : ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {!list.length ? <li className="py-10 text-center text-ink-3">No questions match.</li> : null}
      </ul>
    </Dialog>
  );
}
