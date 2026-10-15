"use client";

import * as React from "react";
import type { Capsule, Memory } from "@/domain/models";
import { Dialog } from "@/components/ui/overlay";
import { Button } from "@/components/ui/button";
import { Checkbox, Segmented } from "@/components/ui/field";
import { DemoNotice, toast } from "@/components/ui/feedback";
import { MemoryReveal } from "@/components/capture/memory-reveal";
import { useDemoStore } from "@/store/demo-store";
import { uid } from "@/lib/utils";

/**
 * Share-preview composer. Public sharing is opt-in and not available in
 * Part One: this prepares a consented, family-only share record and a preview.
 */
export function ShareComposer({ open, onOpenChange, memory, capsule }: { open: boolean; onOpenChange: (v: boolean) => void; memory: Memory; capsule: Capsule }) {
  const [format, setFormat] = React.useState<"portrait" | "square" | "card">("portrait");
  const [consent, setConsent] = React.useState(false);
  const mutate = useDemoStore((s) => s.mutate);
  const persona = useDemoStore((s) => s.db.personas.find((p) => p.id === s.db.activePersonaId));

  const prepare = () => {
    mutate(
      (d) => {
        d.shareGrants.unshift({
          id: uid("share"),
          capsuleId: capsule.id,
          memoryId: memory.id,
          audience: "family_link",
          format: format === "portrait" ? "portrait_story" : format === "square" ? "audio_quote" : "milestone",
          consentConfirmedBy: persona?.name ?? "Owner",
          createdAt: new Date().toISOString(),
          publicUrl: null,
        });
      },
      { actor: persona?.name ?? "Owner", action: "share.prepared_family_only", target: memory.id },
    );
    toast.success("Share preview prepared", "Family-only. No public link was created, and nothing was posted.");
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Share this memory"
      description="Preview how this story would look as a card. Sharing is always a deliberate choice."
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={prepare} disabled={!consent}>
            Prepare family-only share
          </Button>
        </>
      }
    >
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid place-items-center rounded-[20px] bg-ivory p-6">
          <div className={format === "portrait" ? "w-[min(100%,300px)]" : format === "square" ? "w-[min(100%,420px)]" : "w-full max-w-lg"}>
            <MemoryReveal memory={memory} subjectName={capsule.subjectName} format={format} animate={false} />
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-[0.9375rem] font-medium">Format</p>
            <Segmented
              label="Card format"
              value={format}
              onChange={setFormat}
              options={[
                { value: "portrait", label: "9:16" },
                { value: "square", label: "1:1" },
                { value: "card", label: "Card" },
              ]}
            />
          </div>
          <Checkbox
            id="share-consent"
            checked={consent}
            onCheckedChange={setConsent}
            label={`${memory.attribution.displayName} agreed to share this`}
            description="Contributors decide whether their stories leave the archive."
          />
          <DemoNotice title="Public sharing is off">
            This preview never creates a public link or posts anywhere. Image downloads and invite-only links arrive with real accounts, moderation and a consent record.
          </DemoNotice>
        </div>
      </div>
    </Dialog>
  );
}
