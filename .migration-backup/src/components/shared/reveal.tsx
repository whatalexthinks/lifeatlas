"use client";

import * as React from "react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

export function Reveal({ children, className, delay = 0, as: Tag = "div" }: { children: React.ReactNode; className?: string; delay?: number; as?: "div" | "section" | "li" | "article" }) {
  const { ref, revealed } = useReveal<HTMLElement>();
  return (
    <Tag ref={ref as React.Ref<never>} className={cn("reveal", className)} data-revealed={revealed} style={{ ["--reveal-delay" as string]: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

/** Headline that rises word by word on first paint. Server-safe markup, CSS-only motion. */
export function RiseText({ text, className, italicWords = [], baseDelay = 0 }: { text: string; className?: string; italicWords?: string[]; baseDelay?: number }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className={cn("rise-word", italicWords.includes(w.replace(/[.,]/g, "")) && "italic")} style={{ ["--d" as string]: `${baseDelay + i * 70}ms` }}>
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </span>
  );
}
