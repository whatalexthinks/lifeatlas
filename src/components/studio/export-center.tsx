"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Download, FileArchive, FileCode2, FileJson, Info, MinusCircle } from "lucide-react";
import type { Capsule, ExportFormat, ExportOptions } from "@/domain/models";
import { Panel } from "./primitives";
import { Button } from "@/components/ui/button";
import { Badge, DemoNotice, Spinner, toast } from "@/components/ui/feedback";
import { Checkbox, ChoiceCards } from "@/components/ui/field";
import { useDb } from "@/hooks/use-data";
import { services } from "@/services/factory";
import type { ExportPreview } from "@/services/contracts";
import { cn, downloadBlob, formatBytes, relativeTime } from "@/lib/utils";

const defaults: ExportOptions = { includeAudio: true, includePhotos: true, includePrivate: false, includeDrafts: false, includeSamplePlates: true };

export function ExportCenter({ capsule }: { capsule: Capsule }) {
  const [options, setOptions] = React.useState<ExportOptions>(defaults);
  const [format, setFormat] = React.useState<ExportFormat>("zip");
  // The preview remembers what it was built for; while a new one builds, the last one stays visible.
  const key = `${capsule.id}:${JSON.stringify(options)}`;
  const [built, setBuilt] = React.useState<{ key: string; preview: ExportPreview | null } | null>(null);
  const preview = built?.preview ?? null;
  const loading = built?.key !== key;
  const [building, setBuilding] = React.useState(false);
  const jobs = useDb((d) => d.exportJobs).filter((j) => j.capsuleId === capsule.id);

  React.useEffect(() => {
    let alive = true;
    void services()
      .export.preview(capsule.id, options)
      .then((r) => {
        if (alive) setBuilt((prev) => ({ key: `${capsule.id}:${JSON.stringify(options)}`, preview: r.status === "ok" ? r.data : (prev?.preview ?? null) }));
      });
    return () => {
      alive = false;
    };
  }, [capsule.id, options]);

  const build = async () => {
    setBuilding(true);
    const r = await services().export.build(capsule.id, options, format);
    setBuilding(false);
    if (r.status !== "ok") {
      toast.error("Export failed", r.status === "error" ? r.message : undefined);
      return;
    }
    downloadBlob(r.data.blob, r.data.job.fileName!);
    toast.success("Downloaded to this device", `${r.data.job.fileName} · ${formatBytes(r.data.job.byteSize)}`);
  };

  const included = preview?.items.filter((i) => i.included) ?? [];
  const excluded = preview?.items.filter((i) => !i.included) ?? [];
  const opt = (k: keyof ExportOptions) => (v: boolean) => setOptions((o) => ({ ...o, [k]: v }));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-6">
        <Panel title="Choose a format">
          <ChoiceCards
            name="format"
            value={format}
            onChange={setFormat}
            columns={1}
            options={[
              { value: "zip", label: "Complete archive (.zip)", description: "Original files, a readable offline page (index.html), stories.md and manifest.json with checksums.", icon: <FileArchive className="size-5" /> },
              { value: "html", label: "Single offline page (.html)", description: "One file with stories, photos and recordings embedded. Opens in any browser.", icon: <FileCode2 className="size-5" /> },
              { value: "json", label: "Records only (.json)", description: "The documented manifest — stories, dates, places, people. No media files.", icon: <FileJson className="size-5" /> },
            ]}
          />
        </Panel>
        <Panel title="What to include">
          <div className="space-y-4">
            <Checkbox id="o-photos" checked={options.includePhotos} onCheckedChange={opt("includePhotos")} label="Photographs" />
            <Checkbox id="o-audio" checked={options.includeAudio} onCheckedChange={opt("includeAudio")} label="Voice recordings" />
            <Checkbox id="o-plates" checked={options.includeSamplePlates} onCheckedChange={opt("includeSamplePlates")} label="Sample illustrations" description="Only relevant to the fictional sample family." />
            <Checkbox id="o-private" checked={options.includePrivate} onCheckedChange={opt("includePrivate")} label="Private stories" description="Only for a copy you'll keep yourself." />
            <Checkbox id="o-drafts" checked={options.includeDrafts} onCheckedChange={opt("includeDrafts")} label="Drafts and unapproved contributions" />
          </div>
        </Panel>
        <DemoNotice title="Where this file goes">
          The export is built in this browser and downloaded straight to this device. Nothing is uploaded. Keep at least two copies in different places — a drive at home and a cloud folder you control.
        </DemoNotice>
      </div>

      <div className="space-y-6">
        <Panel
          title="Preview"
          description={preview ? `${included.filter((i) => i.kind === "memory").length} stories · ${included.filter((i) => i.kind !== "memory").length} files · about ${formatBytes(preview.estimatedBytes)}` : "Checking what's on this device…"}
          actions={loading ? <Spinner /> : null}
        >
          {preview?.warnings.length ? (
            <div className="mb-5 space-y-2">
              {preview.warnings.map((w) => (
                <p key={w} className="flex items-start gap-2 rounded-[12px] bg-warning-soft px-3.5 py-2.5 text-[0.875rem] text-ink-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" /> {w}
                </p>
              ))}
            </div>
          ) : null}
          <div className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
            {included.map((i) => (
              <p key={i.id} className="flex items-center justify-between gap-3 rounded-[10px] px-2 py-1.5 text-[0.875rem]">
                <span className="flex min-w-0 items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                  <span className="truncate">{i.label}</span>
                </span>
                <Badge tone="neutral">{i.kind === "memory" ? "Story" : i.kind === "audio" ? "Recording" : i.kind === "plate" ? "Illustration" : "Photo"}</Badge>
              </p>
            ))}
            {excluded.length ? <p className="catalog px-2 pb-1 pt-4">Not included</p> : null}
            {excluded.map((i) => (
              <p key={i.id} className="flex items-center justify-between gap-3 rounded-[10px] px-2 py-1.5 text-[0.875rem] text-ink-3">
                <span className="flex min-w-0 items-center gap-2">
                  <MinusCircle className={cn("size-4 shrink-0", i.reason === "Missing from this device" ? "text-danger" : "text-ink-4")} />
                  <span className="truncate">{i.label}</span>
                </span>
                <span className={cn("shrink-0 text-[0.75rem]", i.reason === "Missing from this device" && "font-medium text-danger")}>{i.reason}</span>
              </p>
            ))}
          </div>
          <Button size="lg" className="mt-6" block loading={building} onClick={() => void build()} leading={<Download className="size-4" />} disabled={!preview || loading}>
            Build &amp; download {format === "zip" ? "archive" : format === "html" ? "offline page" : "records"}
          </Button>
          <p className="mt-3 flex items-start gap-2 text-[0.8125rem] text-ink-3">
            <Info className="mt-0.5 size-3.5 shrink-0" /> Every export lists anything it couldn&rsquo;t include, so you never mistake a partial copy for a complete one.
          </p>
        </Panel>

        <Panel title="Export history" bodyClassName="p-3 sm:p-3">
          {jobs.length === 0 ? (
            <p className="p-3 text-[0.9rem] text-ink-3">No exports yet from this device.</p>
          ) : (
            <ul>
              {jobs.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-3 rounded-[12px] p-3 text-[0.875rem]">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{j.fileName ?? `${j.format.toUpperCase()} export`}</span>
                    <span className="text-ink-3">
                      {relativeTime(j.createdAt)}
                      {j.counts ? ` · ${j.counts.memories} stories, ${j.counts.photos} photos, ${j.counts.audio} recordings${j.counts.missing ? `, ${j.counts.missing} missing` : ""}` : ""}
                    </span>
                  </span>
                  <Badge tone={j.status === "ready" ? "success" : j.status === "failed" ? "danger" : "info"}>{j.status === "ready" ? `Ready · ${formatBytes(j.byteSize)}` : j.status}</Badge>
                </li>
              ))}
            </ul>
          )}
          <p className="px-3 pb-1 text-[0.75rem] text-ink-4">Files aren&rsquo;t stored by LifeAtlas after download — build a fresh copy any time.</p>
        </Panel>
      </div>
    </div>
  );
}
