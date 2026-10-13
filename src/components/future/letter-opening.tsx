"use client";

import * as React from "react";
import type { FutureMessage } from "@/domain/models";
import { BrandMark } from "@/components/brand/logo";
import { AudioPlayer } from "@/components/audio/audio-player";
import { MediaImage } from "@/components/media/media-image";
import { Button } from "@/components/ui/button";
import { useDb } from "@/hooks/use-data";
import { usePrefersReducedMotion } from "@/hooks/use-reveal";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** The future-opening experience: a sealed envelope that opens to a letter. Never autoplays. */
export function LetterOpening({ message, mode, onOpened }: { message: FutureMessage; mode: "preview" | "example"; onOpened?: () => void }) {
  const [stage, setStage] = React.useState<"sealed" | "opening" | "open">("sealed");
  const media = useDb((d) => d.media);
  const reduced = usePrefersReducedMotion();
  const attachments = message.attachmentIds.map((id) => media.find((m) => m.id === id)).filter(Boolean);
  const open = () => {
    setStage("opening");
    setTimeout(
      () => {
        setStage("open");
        onOpened?.();
      },
      reduced ? 0 : 1700,
    );
  };
  return (
    <div className="relative">
      {stage !== "open" ? (
        <div className="flex flex-col items-center py-6 text-center">
          <div className={cn("transition-opacity duration-500", stage === "opening" && "opacity-0")}>
            <p className="font-mono text-[0.75rem] uppercase tracking-[0.2em] text-[#c4ad86]">{mode === "example" ? "An example of opening day" : "Preview of opening day"}</p>
            <h2 className="mt-4 max-w-xl font-serif text-[clamp(2.2rem,1.7rem+2vw,3.4rem)] leading-[1.05] text-night-ink">
              {mode === "example" ? (
                <>
                  Opening day, <em>as it will feel.</em>
                </>
              ) : (
                <>
                  For {message.recipient.name}, <em>from {message.authorName.split(" ")[0]}.</em>
                </>
              )}
            </h2>
            <p className="mt-3 text-night-ink-2">To be opened {message.release.milestone ? `on ${message.release.milestone.replace(/_/g, " ")}` : formatDate(message.release.date, "long")}</p>
          </div>
          <div className="relative mt-12 aspect-[1.55] w-full max-w-md" style={{ perspective: "1400px" }}>
            {/* back of the envelope */}
            <div className="absolute inset-0 rounded-[6px] bg-[#d9ccb0] shadow-[0_40px_70px_-30px_rgb(0_0_0/0.85)]" />
            {/* the letter inside — rises as the flap opens */}
            <div
              className={cn(
                "absolute inset-x-[6%] top-[8%] h-[84%] rounded-[3px] bg-[#fbf8f1] px-[8%] pt-[7%] text-left transition-transform duration-[1000ms] ease-[var(--ease-out)] [transition-delay:500ms]",
                stage === "opening" ? "-translate-y-[46%]" : "translate-y-0",
              )}
              style={{ zIndex: 1 }}
            >
              <span className="block h-[3px] w-1/3 rounded bg-[#d7cdb9]" />
              <span className="mt-3 block h-[3px] w-4/5 rounded bg-[#e3dbca]" />
              <span className="mt-2 block h-[3px] w-3/4 rounded bg-[#e3dbca]" />
              <span className="mt-2 block h-[3px] w-2/3 rounded bg-[#e3dbca]" />
            </div>
            {/* side and bottom pockets */}
            <svg viewBox="0 0 310 200" className="absolute inset-0 size-full" preserveAspectRatio="none" aria-hidden style={{ zIndex: 2 }}>
              <defs>
                <linearGradient id="lo-side" x1="0" x2="1">
                  <stop offset="0" stopColor="#ebe2cf" />
                  <stop offset="1" stopColor="#e2d7bf" />
                </linearGradient>
                <linearGradient id="lo-bottom" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#efe7d6" />
                  <stop offset="1" stopColor="#e6dcc6" />
                </linearGradient>
              </defs>
              <path d="M0 0 L140 108 L0 200 Z" fill="url(#lo-side)" />
              <path d="M310 0 L170 108 L310 200 Z" fill="url(#lo-side)" />
              <path d="M0 200 L155 92 L310 200 Z" fill="url(#lo-bottom)" />
              <path d="M0 200 L155 92 L310 200" fill="none" stroke="#cbbd9c" strokeWidth="0.8" />
            </svg>
            {/* top flap */}
            <div
              className="absolute inset-x-0 top-0 h-[60%] origin-top transition-transform duration-[900ms] ease-[var(--ease-out)]"
              style={{
                transform: stage === "opening" ? "rotateX(180deg)" : "rotateX(0)",
                transformStyle: "preserve-3d",
                zIndex: stage === "opening" ? 0 : 3,
              }}
            >
              <svg viewBox="0 0 310 120" className="absolute inset-0 size-full drop-shadow-[0_6px_6px_rgb(0_0_0/0.18)]" preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id="lo-flap" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#f3ecdd" />
                    <stop offset="1" stopColor="#e8dec8" />
                  </linearGradient>
                </defs>
                <path d="M0 0 L310 0 L162 116 Q155 121 148 116 Z" fill="url(#lo-flap)" />
              </svg>
            </div>
            <div
              className={cn(
                "absolute left-1/2 top-[58%] grid aspect-square w-[18%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#b5513c,#7a2a1c_70%)] text-[#f1cdb7] shadow-[0_8px_16px_-6px_rgb(60_10_5/0.8),inset_0_-3px_8px_rgb(0_0_0/0.35)] transition-[opacity,transform] duration-500",
                stage === "opening" && "scale-90 opacity-0",
              )}
              style={{ zIndex: 4 }}
            >
              <BrandMark className="size-[52%]" />
            </div>
          </div>
          <Button variant="light" size="xl" className="mt-10" onClick={open} disabled={stage === "opening"}>
            Break the seal
          </Button>
          {message.dedication ? <p className="mt-6 max-w-md font-serif italic text-night-ink-2">{message.dedication}</p> : null}
        </div>
      ) : (
        <article className="mx-auto max-w-[42rem] animate-[fade-up_900ms_var(--ease-out)_both] rounded-[6px] bg-[#fbf8f1] px-7 py-10 text-[#242824] shadow-[0_40px_80px_-40px_rgb(0_0_0/0.8)] sm:px-14 sm:py-16">
          <div className="flex items-center justify-between">
            <span className="text-[#34473f]">
              <BrandMark className="size-7" />
            </span>
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-[#74613f]">Written {formatDate(message.createdAt, "long")}</span>
          </div>
          <h2 className="mt-10 font-serif text-[2.4rem] leading-tight">{message.title}</h2>
          <div className="prose-story mt-8 text-[#242824]">
            {message.body.split(/\n{2,}/).map((p, i) => (
              <p key={i} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>
          {attachments.length ? (
            <div className="mt-10 space-y-5">
              {attachments.map((a) =>
                a!.kind === "audio" ? (
                  <AudioPlayer key={a!.id} asset={a!} title={`A recording from ${message.authorName.split(" ")[0]}`} />
                ) : (
                  <figure key={a!.id} className="mount">
                    <MediaImage asset={a!} className="aspect-[4/3]" />
                    <figcaption className="px-1 pt-3 font-serif text-[0.95rem] italic text-[#474b45]">{a!.caption}</figcaption>
                  </figure>
                ),
              )}
            </div>
          ) : null}
          <p className="mt-10 font-serif text-[1.3rem] italic">— {message.authorName}</p>
        </article>
      )}
    </div>
  );
}
