"use client";

import * as React from "react";
import { AlertTriangle, ArchiveRestore, CheckCircle2, FileUp, XCircle } from "lucide-react";
import type { ArchiveInspection } from "@/services/contracts";
import { Button, ButtonLink } from "@/components/ui/button";
import { flushSave } from "@/store/demo-store";
import { services } from "@/services/factory";
import { formatDate, pluralize } from "@/lib/utils";

type State =
  | { kind: "idle" }
  | { kind: "checking"; name: string }
  | { kind: "checked"; inspection: ArchiveInspection }
  | { kind: "restoring"; inspection: ArchiveInspection }
  | { kind: "done"; capsuleId: string; name: string; stories: number; files: number; skipped: string[] }
  | { kind: "error"; message: string };

/**
 * Bring an archive back from a OurLifeCapsule export. The file is checked first — every photo
 * and recording against the fingerprint recorded when it was exported — and nothing
 * changes until the person confirms. A restore always becomes a new capsule.
 */
export function RestorePanel() {
  const [state, setState] = React.useState<State>({ kind: "idle" });
  const input = React.useRef<HTMLInputElement | null>(null);
  const status = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (state.kind === "checked" || state.kind === "done" || state.kind === "error") status.current?.focus();
  }, [state.kind]);

  const inspect = async (file: File | undefined) => {
    if (!file) return;
    setState({ kind: "checking", name: file.name });
    const r = await services().export.inspectArchive(file);
    if (input.current) input.current.value = "";
    setState(r.status === "ok" ? { kind: "checked", inspection: r.data } : { kind: "error", message: r.status === "error" ? r.message : "Restoring isn't available here." });
  };

  const restore = async (inspection: ArchiveInspection) => {
    setState({ kind: "restoring", inspection });
    const r = await services().export.restoreArchive(inspection.token);
    if (r.status !== "ok") return setState({ kind: "error", message: r.status === "error" ? r.message : "Restoring isn't available here." });
    await flushSave().catch(() => undefined);
    setState({ kind: "done", capsuleId: r.data.capsuleId, name: inspection.capsuleName, stories: r.data.stories, files: r.data.files, skipped: r.data.skipped });
  };

  const chooser = (
    <div className="flex flex-wrap items-center gap-3">
      <input ref={input} id="restore-file" aria-label="Choose an export file to restore" tabIndex={-1} type="file" accept=".zip,.json,application/zip,application/json" className="sr-only" onChange={(e) => void inspect(e.target.files?.[0])} />
      <Button variant="secondary" leading={<FileUp className="size-4" />} onClick={() => input.current?.click()} loading={state.kind === "checking"}>
        {state.kind === "idle" ? "Choose an export file" : "Choose a different file"}
      </Button>
      <span className="text-[0.8125rem] text-ink-3">A .zip or .json made by Download above. The file is read in this browser only.</span>
    </div>
  );

  return (
    <section aria-labelledby="restore-h" className="mt-12 rounded-[24px] border border-line bg-surface p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-evergreen/10 text-evergreen">
          <ArchiveRestore className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id="restore-h" className="font-serif text-[1.8rem] leading-tight">
            Restore from an export
          </h2>
          <p className="mt-2 max-w-2xl text-ink-2">If this browser&rsquo;s copy is lost, bring an archive back from a file you downloaded. Every photo and recording is checked against its fingerprint first, and the archive comes back as a new capsule — nothing here is overwritten.</p>
        </div>
      </div>

      <div className="mt-6" ref={status} tabIndex={-1} aria-live="polite">
        {state.kind === "idle" || state.kind === "checking" ? chooser : null}

        {state.kind === "error" ? (
          <div className="space-y-4">
            <p role="alert" className="flex gap-3 rounded-[14px] bg-danger-soft px-4 py-3 text-[0.9375rem]">
              <XCircle className="mt-0.5 size-5 shrink-0 text-danger" />
              <span>{state.message}</span>
            </p>
            {chooser}
          </div>
        ) : null}

        {state.kind === "checked" || state.kind === "restoring" ? (
          <div className="space-y-5">
            <div className="rounded-[16px] bg-paper p-5">
              <p className="text-[0.8125rem] text-ink-3">
                {state.inspection.fileName} · exported {formatDate(state.inspection.generatedAt, "long")}
              </p>
              <p className="mt-1 font-serif text-[1.5rem] leading-tight">{state.inspection.capsuleName}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-[0.9375rem] sm:grid-cols-5">
                {[
                  ["Stories", state.inspection.stories],
                  ["Photographs", state.inspection.verified.photos],
                  ["Recordings", state.inspection.verified.recordings],
                  ["People", state.inspection.people],
                  ["Places", state.inspection.places],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[0.75rem] uppercase tracking-[0.1em] text-ink-3">{k}</dt>
                    <dd className="font-serif text-[1.5rem] tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 flex items-center gap-2 text-[0.875rem] text-success">
                <CheckCircle2 className="size-4" />
                {state.inspection.verified.photos + state.inspection.verified.recordings
                  ? `${pluralize(state.inspection.verified.photos + state.inspection.verified.recordings, "file")} match their fingerprints exactly.`
                  : "The manifest is complete and readable."}
              </p>
            </div>
            {state.inspection.damaged.length ? (
              <div className="rounded-[14px] border border-warning/30 bg-warning-soft px-4 py-3 text-[0.9375rem]">
                <p className="font-medium">Won&rsquo;t be restored — the file has changed since export:</p>
                <ul className="mt-1 list-disc pl-5 text-ink-2">
                  {state.inspection.damaged.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <ul className="space-y-1.5 text-[0.875rem] text-ink-2">
              {state.inspection.warnings.map((w) => (
                <li key={w} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                  {w}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void restore(state.inspection)} loading={state.kind === "restoring"} leading={<ArchiveRestore className="size-4" />}>
                Restore as a new capsule
              </Button>
              <Button variant="ghost" disabled={state.kind === "restoring"} onClick={() => setState({ kind: "idle" })}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {state.kind === "done" ? (
          <div className="space-y-4">
            <p className="flex gap-3 rounded-[14px] bg-success-soft px-4 py-3 text-[0.9375rem]">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              <span>
                <strong className="font-medium">{state.name}&rsquo;s archive is back.</strong> {pluralize(state.stories, "story", "stories")} and {pluralize(state.files, "file")} restored as a new capsule on this device.
              </span>
            </p>
            {state.skipped.length ? (
              <details className="text-[0.875rem] text-ink-2">
                <summary className="cursor-pointer">{pluralize(state.skipped.length, "item")} couldn&rsquo;t be restored</summary>
                <ul className="mt-2 list-disc pl-5">
                  {state.skipped.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </details>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={`/app/capsules/${state.capsuleId}`}>Open the restored capsule</ButtonLink>
              <Button variant="ghost" onClick={() => setState({ kind: "idle" })}>
                Restore another
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
