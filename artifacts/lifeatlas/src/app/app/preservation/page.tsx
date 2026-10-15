"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Cloud, Download, HardDrive, Laptop, Loader2, RotateCcw, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import type { IntegrityCheck } from "@/domain/models";
import { PageHeader, Panel } from "@/components/studio/primitives";
import { ExportCenter } from "@/components/studio/export-center";
import { RestorePanel } from "@/components/studio/restore-panel";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, Skeleton, toast } from "@/components/ui/feedback";
import { Select } from "@/components/ui/field";
import { useDb, useHydrated } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { cn, formatBytes, formatDate, relativeTime } from "@/lib/utils";
import { brand } from "@/config/brand";

type Persisted = "unknown" | "granted" | "not_granted" | "unsupported";

/** Real browser storage facts: usage, quota and whether eviction protection is on. */
function useDeviceStorage() {
  const [state, setState] = React.useState<{ usage?: number; quota?: number; persisted: Persisted }>({ persisted: "unknown" });
  const refresh = React.useCallback(async () => {
    if (!navigator.storage?.estimate) return setState({ persisted: "unsupported" });
    const [est, persisted] = await Promise.all([navigator.storage.estimate(), navigator.storage.persisted?.() ?? Promise.resolve(false)]);
    setState({ usage: est.usage, quota: est.quota, persisted: persisted ? "granted" : "not_granted" });
  }, []);
  React.useEffect(() => {
    let live = true;
    void (async () => {
      if (!navigator.storage?.estimate) return live && setState({ persisted: "unsupported" });
      const [est, persisted] = await Promise.all([navigator.storage.estimate(), navigator.storage.persisted?.() ?? Promise.resolve(false)]);
      if (live) setState({ usage: est.usage, quota: est.quota, persisted: persisted ? "granted" : "not_granted" });
    })();
    return () => {
      live = false;
    };
  }, []);
  return { ...state, refresh };
}

export default function PreservationPage() {
  const hydrated = useHydrated();
  const capsules = useDb((d) => d.capsules);
  const exportJobs = useDb((d) => d.exportJobs);
  const checks = useDb((d) => d.integrityChecks);
  const successors = useDb((d) => d.successors);
  const [capsuleId, setCapsuleId] = React.useState(() => (capsules.some((c) => c.id === "cap_margaret") ? "cap_margaret" : capsules[0]?.id ?? ""));
  const capsule = capsules.find((c) => c.id === capsuleId) ?? capsules[0];
  const device = useDeviceStorage();
  const [running, setRunning] = React.useState(false);
  const [lastRun, setLastRun] = React.useState<(IntegrityCheck & { details: { id: string; ok: boolean; reason?: string }[] }) | null>(null);
  const lastExport = exportJobs.find((j) => j.status === "ready");
  const capsuleChecks = checks.filter((c) => c.capsuleId === capsule?.id);

  const requestPersistence = async () => {
    if (!navigator.storage?.persist) return toast.info("This browser can't protect storage from clean-up");
    const granted = await navigator.storage.persist();
    await device.refresh();
    if (granted) toast.success(`This browser will keep ${brand.name} data`, "It won't be cleared automatically to free space. It's still not a backup.");
    else toast.info("The browser declined", "Browsers decide this themselves, often after you bookmark or install the site. Keep exporting copies.");
  };

  const runCheck = async () => {
    if (!capsule) return;
    setRunning(true);
    const r = await services().preservation.runLocalIntegrityCheck(capsule.id);
    setRunning(false);
    if (r.status === "ok") {
      setLastRun(r.data);
      if (r.data.result === "passed") toast.success(`All ${r.data.filesChecked} files match their fingerprints`);
      else toast.warning(`${r.data.mismatches} of ${r.data.filesChecked} files need attention`);
    }
  };

  const tiles: { icon: React.ReactNode; title: string; state: "ok" | "warn" | "off"; status: string; body: string }[] = [
    {
      icon: <Laptop className="size-5" />,
      title: "This browser",
      state: device.persisted === "granted" ? "ok" : "warn",
      status: device.persisted === "granted" ? "Protected from clean-up" : "Can be cleared",
      body: device.usage !== undefined ? `${formatBytes(device.usage)} stored on this device.` : "Measuring…",
    },
    { icon: <Cloud className="size-5" />, title: "Cloud copy", state: "off", status: "Not connected", body: "Hosted storage arrives with accounts. Nothing has been uploaded." },
    { icon: <HardDrive className="size-5" />, title: "Second, independent copy", state: "off", status: "Not connected", body: "A separate provider and region, checked on a schedule. Not built yet." },
    {
      icon: <Download className="size-5" />,
      title: "Copies you downloaded",
      state: lastExport ? "ok" : "warn",
      status: lastExport ? `Last ${relativeTime(lastExport.completedAt ?? lastExport.createdAt)}` : "None yet",
      body: lastExport ? `${lastExport.fileName ?? "Archive"}${lastExport.byteSize ? ` · ${formatBytes(lastExport.byteSize)}` : ""}` : "The one copy that's truly yours today. Make one below.",
    },
  ];

  return (
    <div className="mx-auto max-w-[1240px]">
      <PageHeader
        eyebrow="Account · Preservation"
        title={
          <>
            Keep it <em>safe.</em>
          </>
        }
        description="Where your family's stories live right now, what protects them, and how to take a copy with you. We'd rather be plain about this than reassuring."
      />

      <div role="alert" className="mb-8 flex gap-4 rounded-[16px] border border-danger/25 bg-danger-soft px-5 py-5 sm:px-6">
        <ShieldAlert className="mt-0.5 size-6 shrink-0 text-danger" />
        <div>
          <p className="font-medium text-ink">These stories are not backed up.</p>
          <p className="mt-1 max-w-3xl text-[0.9375rem] leading-relaxed text-ink-2">
            In this preview everything lives only in this browser on this device. Clearing site data, a browser reset or a lost laptop removes it, and there is no server to recover from. Download a copy of anything you can&rsquo;t replace, and keep your original files.
          </p>
        </div>
      </div>

      <section aria-labelledby="where-h">
        <h2 id="where-h" className="sr-only">
          Where your stories live
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tiles.map((t) => (
            <li key={t.title} className={cn("card-paper flex flex-col p-5", t.state === "off" && "bg-transparent shadow-none")}>
              <div className="flex items-center justify-between">
                <span className={cn("grid size-10 place-items-center rounded-full", t.state === "ok" ? "bg-success-soft text-success" : t.state === "warn" ? "bg-warning-soft text-warning" : "bg-ink/5 text-ink-4")}>{t.icon}</span>
                <span className={cn("inline-flex items-center gap-1.5 text-[0.8125rem]", t.state === "ok" ? "text-success" : t.state === "warn" ? "text-warning" : "text-ink-3")}>
                  {t.state === "ok" ? <CheckCircle2 className="size-4" /> : t.state === "warn" ? <AlertTriangle className="size-4" /> : <XCircle className="size-4" />}
                  {hydrated ? t.status : "…"}
                </span>
              </div>
              <p className="mt-4 font-medium">{t.title}</p>
              <p className="mt-1 text-[0.875rem] leading-relaxed text-ink-3">{hydrated ? t.body : <Skeleton className="h-4 w-3/4" />}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title="Protect this browser's copy" description={`Ask the browser not to clear ${brand.name} data when space runs low.`}>
          <div className="flex flex-wrap items-center gap-4">
            <Badge tone={device.persisted === "granted" ? "success" : "warning"} dot>
              {device.persisted === "granted" ? "Persistent storage on" : device.persisted === "unsupported" ? "Not supported here" : "Best-effort storage"}
            </Badge>
            {device.quota ? <span className="text-[0.875rem] text-ink-3">Room for about {formatBytes(device.quota)} in this browser</span> : null}
          </div>
          <p className="mt-4 text-[0.9375rem] text-ink-2">This uses your browser&rsquo;s real storage protection. It helps, but a browser profile is still a single copy on a single device.</p>
          {device.persisted !== "granted" && device.persisted !== "unsupported" ? (
            <Button variant="secondary" className="mt-5" onClick={() => void requestPersistence()}>
              Ask the browser to keep it
            </Button>
          ) : null}
        </Panel>

        <Panel
          title="Check the files"
          description="Recalculates the fingerprint of every photo and recording and compares it with the one saved when it was added."
          actions={
            capsules.length > 1 ? (
              <Select aria-label="Capsule" value={capsule?.id} onChange={(e) => setCapsuleId(e.target.value)} className="h-10 w-auto min-w-40 text-[0.875rem]">
                {capsules.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.subjectName}
                  </option>
                ))}
              </Select>
            ) : null
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void runCheck()} disabled={running} leading={running ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}>
              {running ? "Checking…" : "Run integrity check"}
            </Button>
            <Button
              variant="ghost"
              leading={<RotateCcw className="size-4" />}
              onClick={async () => {
                const r = await services().preservation.runRestoreTest(capsule?.id ?? "");
                if (r.status === "not_configured") toast.info("Restore drills need connected backups", r.message);
              }}
            >
              Test a restore
            </Button>
          </div>
          {lastRun ? (
            <div className="mt-5 rounded-[12px] bg-ivory/70 p-4" aria-live="polite">
              <p className="flex items-center gap-2 font-medium">
                {lastRun.result === "passed" ? <CheckCircle2 className="size-5 text-success" /> : <AlertTriangle className="size-5 text-warning" />}
                {lastRun.filesChecked === 0 ? "No device files to check in this capsule yet" : lastRun.result === "passed" ? `${lastRun.filesChecked} files checked, every one matches` : `${lastRun.mismatches} of ${lastRun.filesChecked} files didn't match`}
              </p>
              {lastRun.details.some((d) => !d.ok) ? (
                <ul className="mt-2 space-y-1 text-[0.875rem] text-ink-2">
                  {lastRun.details
                    .filter((d) => !d.ok)
                    .map((d) => (
                      <li key={d.id} className="font-mono text-[0.8125rem]">
                        {d.id}, {d.reason}
                      </li>
                    ))}
                </ul>
              ) : null}
              <p className="mt-2 text-[0.8125rem] text-ink-3">Checks files saved on this device. Supplied example photographs are not your files and are not part of this check.</p>
            </div>
          ) : null}
          {capsuleChecks.length ? (
            <div className="mt-5">
              <p className="text-[0.8125rem] text-ink-3">Recent checks</p>
              <ul className="mt-2 divide-y divide-line text-[0.875rem]">
                {capsuleChecks.slice(0, 4).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                    <span>{formatDate(c.at, "long")}</span>
                    <span className="text-ink-3">
                      {c.filesChecked} files · {c.mismatches ? `${c.mismatches} problems` : "all matched"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Panel>
      </div>

      <section className="mt-12" aria-labelledby="export-h">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">The copy that&rsquo;s yours</p>
            <h2 id="export-h" className="mt-3 font-serif text-[2rem] leading-tight">
              Download {capsule?.subjectName ? `${capsule.subjectName.split(" ")[0]}'s` : "the"} archive
            </h2>
            <p className="mt-2 max-w-2xl text-ink-2">Ordinary files, stories as text and HTML, photos and recordings as they were added, and a manifest with fingerprints. Readable without {brand.name}, forever.</p>
          </div>
        </div>
        {capsule ? <ExportCenter capsule={capsule} /> : null}
      </section>

      <RestorePanel />

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="A good habit: three copies">
          <ol className="grid gap-5 sm:grid-cols-3">
            {[
              ["Three copies", "The original files, this archive, and one more export."],
              ["Two kinds of storage", "For example a computer and an external drive."],
              ["One somewhere else", "A drive at a relative's house, or a cloud folder you trust."],
            ].map(([t, d], i) => (
              <li key={t}>
                <span className="font-mono text-[0.75rem] text-ink-4">0{i + 1}</span>
                <p className="mt-2 font-medium">{t}</p>
                <p className="mt-1 text-[0.875rem] text-ink-3">{d}</p>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="If you can't be the one">
          <p className="text-[0.9375rem] text-ink-2">{successors.length ? `${successors.map((s) => s.name).join(", ")} ${successors.length > 1 ? "are" : "is"} named as your successor on this device.` : "Name someone you trust to look after these stories and any letters you've written."}</p>
          <ButtonLink href="/app/preservation/successor" variant="secondary" className="mt-5" trailing={<ArrowRight className="size-4" />}>
            {successors.length ? "Review successor" : "Name a successor"}
          </ButtonLink>
          <p className="mt-4 text-[0.8125rem] text-ink-3">
            Read <Link href="/data-retention" className="text-link">how storage works in this preview</Link>.
          </p>
        </Panel>
      </div>
    </div>
  );
}
