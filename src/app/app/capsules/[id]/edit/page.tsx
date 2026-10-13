"use client";

import * as React from "react";
import type { Capsule } from "@/domain/models";
import { useStudioCapsule } from "@/components/studio/capsule-frame";
import { Panel } from "@/components/studio/primitives";
import { CapsuleCover, paletteStyles } from "@/components/capsule/capsule-cover";
import { PlacePicker } from "@/components/capsule/inputs";
import { MediaImage } from "@/components/media/media-image";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/feedback";
import { Field, Input, Segmented, Textarea } from "@/components/ui/field";
import { useCapsuleMemories, useDb } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { cn } from "@/lib/utils";

export default function EditCapsule() {
  const { capsule } = useStudioCapsule();
  const memories = useCapsuleMemories(capsule.id, { scope: "studio" });
  const media = useDb((d) => d.media);
  const [v, setV] = React.useState<Capsule>(capsule);
  const [saving, setSaving] = React.useState(false);
  const set = (patch: Partial<Capsule>) => setV((x) => ({ ...x, ...patch }));
  const photos = [...new Set([...(capsule.cover.mediaId ? [capsule.cover.mediaId] : []), ...memories.flatMap((m) => m.photoIds)])].filter((id) => media.some((a) => a.id === id && a.kind === "image"));
  const dirty = JSON.stringify(v) !== JSON.stringify(capsule);

  const save = async () => {
    if (!v.subjectName.trim()) {
      toast.warning("A name is needed");
      return;
    }
    setSaving(true);
    const r = await services().capsules.updateCapsule(capsule.id, {
      subjectName: v.subjectName.trim(),
      preferredName: v.preferredName.trim() || v.subjectName.split(" ")[0],
      relationship: v.relationship,
      title: v.title,
      birthYear: v.birthYear,
      birthplaceId: v.birthplaceId,
      dedication: v.dedication,
      theme: v.theme,
      cover: v.cover,
    });
    setSaving(false);
    if (r.status === "ok") toast.success("Capsule updated");
    else toast.error("Couldn't save", r.status === "error" ? r.message : undefined);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <Panel title="Details">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Name" htmlFor="e-name" className="sm:col-span-2">
              <Input id="e-name" value={v.subjectName} onChange={(e) => set({ subjectName: e.target.value })} />
            </Field>
            <Field label="What family calls them" htmlFor="e-pref">
              <Input id="e-pref" value={v.preferredName} onChange={(e) => set({ preferredName: e.target.value })} />
            </Field>
            <Field label="Relationship" htmlFor="e-rel">
              <Input id="e-rel" value={v.relationship} onChange={(e) => set({ relationship: e.target.value })} />
            </Field>
            <Field label="Archive title" htmlFor="e-title" className="sm:col-span-2" hint="Shown above the name on the cover.">
              <Input id="e-title" value={v.title} onChange={(e) => set({ title: e.target.value })} maxLength={80} />
            </Field>
            <Field label="Year born" htmlFor="e-year" optional>
              <Input id="e-year" type="number" inputMode="numeric" value={v.birthYear ?? ""} onChange={(e) => set({ birthYear: e.target.value ? Number(e.target.value) : undefined })} />
            </Field>
            <div className="space-y-2 sm:col-span-2">
              <p className="text-[0.9375rem] font-medium">Birthplace</p>
              <PlacePicker id="e-birthplace" value={v.birthplaceId} onChange={(id) => set({ birthplaceId: id })} capsuleId={capsule.id} />
            </div>
            <Field label="Dedication" htmlFor="e-ded" optional className="sm:col-span-2">
              <Textarea id="e-ded" value={v.dedication ?? ""} onChange={(e) => set({ dedication: e.target.value })} className="min-h-24" maxLength={400} />
            </Field>
          </div>
        </Panel>

        <Panel title="Cover">
          <div className="space-y-6">
            <div>
              <p className="mb-2 font-medium">Color</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(paletteStyles) as Capsule["theme"]["palette"][]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={v.theme.palette === k}
                    onClick={() => set({ theme: { ...v.theme, palette: k } })}
                    className={cn("flex items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-[0.875rem]", v.theme.palette === k ? "border-evergreen shadow-[0_0_0_1px_var(--evergreen)]" : "border-line-strong")}
                  >
                    <span className="size-7 rounded-full ring-1 ring-black/10" style={{ background: paletteStyles[k].bg }} />
                    {paletteStyles[k].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="mb-2 font-medium">Lettering</p>
                <Segmented
                  label="Lettering"
                  value={v.theme.typography}
                  onChange={(t) => set({ theme: { ...v.theme, typography: t } })}
                  options={[
                    { value: "classic", label: "Classic" },
                    { value: "italic", label: "Italic" },
                    { value: "modern", label: "Modern" },
                  ]}
                />
              </div>
              <div>
                <p className="mb-2 font-medium">Layout</p>
                <Segmented
                  label="Layout"
                  value={v.cover.layout}
                  onChange={(l) => set({ cover: { ...v.cover, layout: l } })}
                  options={[
                    { value: "full_bleed", label: "Full bleed" },
                    { value: "portrait", label: "Framed" },
                    { value: "type_only", label: "Type only" },
                  ]}
                />
              </div>
            </div>
            {v.cover.layout !== "type_only" ? (
              <div>
                <p className="mb-2 font-medium">Photograph</p>
                {photos.length ? (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {photos.map((id) => (
                      <button key={id} type="button" aria-pressed={v.cover.mediaId === id} onClick={() => set({ cover: { ...v.cover, mediaId: id } })} className={cn("overflow-hidden rounded-[10px] ring-offset-2 ring-offset-surface", v.cover.mediaId === id && "ring-2 ring-evergreen")}>
                        <MediaImage mediaId={id} className="aspect-square" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[0.9rem] text-ink-3">Add a photo to any memory to use it here.</p>
                )}
                <div className="mt-4 max-w-sm">
                  <label htmlFor="focal" className="text-[0.875rem] font-medium">
                    Vertical focus
                  </label>
                  <input id="focal" type="range" min={0} max={100} value={v.cover.focalY} onChange={(e) => set({ cover: { ...v.cover, focalY: Number(e.target.value) } })} className="mt-2 w-full accent-[var(--evergreen)]" />
                </div>
              </div>
            ) : null}
          </div>
        </Panel>
        <div className="flex gap-3">
          <Button size="lg" onClick={() => void save()} loading={saving} disabled={!dirty}>
            Save changes
          </Button>
          <Button size="lg" variant="ghost" disabled={!dirty} onClick={() => setV(capsule)}>
            Discard
          </Button>
        </div>
      </div>
      <aside>
        <div className="sticky top-24">
          <p className="catalog mb-3">Preview</p>
          <CapsuleCover capsule={v} size="lg" className="aspect-[4/5] rounded-[22px] shadow-lg" />
        </div>
      </aside>
    </div>
  );
}
