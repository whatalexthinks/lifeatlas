"use client";

import * as React from "react";
import { useParams } from "@/lib/router/navigation";
import { Printer } from "lucide-react";
import { BookPageView, buildBookPages, bookSizeLabel } from "@/components/heirlooms/book-pages";
import { Logo } from "@/components/brand/logo";
import { PrintQuality } from "@/components/media/media-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { useDb, useHydrated } from "@/hooks/use-data";

const pageInches: Record<string, [number, number]> = { "8x10": [8, 10], "10x10": [10, 10], "11x8.5": [11, 8.5] };

/** A page-by-page proof at trim size. "Print → Save as PDF" produces the proof file. */
export default function BookProofPage() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const heirloom = useDb((d) => d.heirlooms.find((h) => h.id === id));
  const memories = useDb((d) => d.memories);
  const places = useDb((d) => d.places);
  const book = heirloom?.book;
  const pages = React.useMemo(
    () =>
      book && heirloom
        ? buildBookPages(
            book,
            memories.filter((m) => m.capsuleId === heirloom.capsuleId && !m.deletedAt),
            places,
          )
        : [],
    [book, heirloom, memories, places],
  );

  if (!hydrated) return <Skeleton className="mx-auto mt-24 h-[60vh] max-w-3xl" />;
  if (!book) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <h1 className="font-serif text-[2.4rem]">This proof isn&rsquo;t on this device.</h1>
          <p className="mt-3 text-ink-2">Proofs are generated from designs saved in this browser.</p>
          <ButtonLink href="/app/heirlooms" variant="secondary" className="mt-6">
            Go to heirlooms
          </ButtonLink>
        </div>
      </div>
    );
  }
  const [w, h] = pageInches[book.size];
  return (
    <>
      <style>{`@media print { @page { size: ${w}in ${h}in; margin: 0; } html, body { background: #fff !important; } .proof-page { width: ${w}in !important; max-width: none !important; margin: 0 !important; box-shadow: none !important; break-after: page; } }`}</style>
      <header className="no-print sticky top-0 z-10 border-b border-black/10 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
          <Logo />
          <p className="hidden text-[0.875rem] text-ink-3 md:block">
            Demo proof · {pages.length} pages · {bookSizeLabel[book.size]}
          </p>
          <Button size="sm" onClick={() => window.print()} leading={<Printer className="size-4" />}>
            Print or save as PDF
          </Button>
        </div>
      </header>
      <div className="no-print mx-auto max-w-3xl px-5 pt-8 text-center text-[0.9375rem] text-ink-2">
        This is a demonstration proof made in your browser. It isn&rsquo;t sent to a printer, and every page is marked &ldquo;Demo proof&rdquo;.
      </div>
      <PrintQuality>
        <main id="main" className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-5 py-10 print:block print:p-0">
          {pages.map((p, i) => (
            <div key={i} className="proof-page w-full shadow-[0_20px_40px_-24px_rgb(0_0_0/0.45)]" style={{ maxWidth: `${Math.min(680, 680 * (w / h))}px` }}>
              <BookPageView page={p} index={i} config={book} proof />
            </div>
          ))}
        </main>
      </PrintQuality>
    </>
  );
}
