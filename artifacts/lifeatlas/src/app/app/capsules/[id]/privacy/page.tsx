"use client";

import * as React from "react";
import { Archive, RotateCcw, Trash2 } from "lucide-react";
import type { LocationVisibility, MemoryPrivacy, Role } from "@/domain/models";
import { useStudioCapsule } from "@/components/studio/capsule-frame";
import { Panel, privacyCopy } from "@/components/studio/primitives";
import { Avatar } from "@/components/studio/persona-switcher";
import { Button } from "@/components/ui/button";
import { Badge, DemoNotice, toast } from "@/components/ui/feedback";
import { ChoiceCards, Select, Switch } from "@/components/ui/field";
import { ConfirmDialog } from "@/components/ui/overlay";
import { roleLabels } from "@/domain/policies/permissions";
import { AccessMatrix } from "@/components/studio/access-matrix";
import { useCapsuleMemories, useDb, usePersona } from "@/hooks/use-data";
import { useDemoStore } from "@/store/demo-store";
import { services } from "@/services/factory";
import { formatDate } from "@/lib/utils";

const ROLES: Role[] = ["owner", "organizer", "storyteller", "contributor", "viewer", "successor"];

export default function StudioPrivacy() {
  const { capsule } = useStudioCapsule();
  const memberships = useDb((d) => d.memberships).filter((m) => m.capsuleId === capsule.id && m.status === "active");
  const people = useDb((d) => d.people);
  const places = useDb((d) => d.places);
  const memories = useCapsuleMemories(capsule.id, { scope: "studio" });
  const mutate = useDemoStore((s) => s.mutate);
  const persona = usePersona();
  const [confirm, setConfirm] = React.useState<null | "delete" | "archive">(null);
  const usedPlaces = places.filter((p) => memories.some((m) => m.placeId === p.id));
  const counts = (["family", "selected", "organizers", "private"] as MemoryPrivacy[]).map((p) => [p, memories.filter((m) => m.privacy === p).length] as const);

  const setRole = (membershipId: string, role: Role) => {
    mutate(
      (d) => {
        const m = d.memberships.find((x) => x.id === membershipId);
        if (m) m.role = role;
      },
      { actor: persona.name, action: "membership.role_changed", target: membershipId, detail: role },
    );
    toast.success("Role updated", "Simulated in this preview, real enforcement arrives with accounts.");
  };

  return (
    <div className="space-y-6">
      <DemoNotice title="Permissions are simulated in this preview">
        What you choose here changes what each demo identity sees. Real access control, enforced on a server for every request, arrives with secure accounts. Nothing here is a security guarantee yet.
      </DemoNotice>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Default for new memories">
          <ChoiceCards
            name="defaultPrivacy"
            value={capsule.defaultPrivacy}
            onChange={(v) => void services().capsules.updateCapsule(capsule.id, { defaultPrivacy: v }).then(() => toast.success("Default updated"))}
            columns={1}
            options={(["family", "organizers", "private"] as MemoryPrivacy[]).map((p) => ({ value: p, label: privacyCopy[p].label, description: privacyCopy[p].description }))}
          />
          <div className="mt-6 border-t border-line pt-5">
            <Switch
              id="viewer-enabled"
              checked={capsule.viewerEnabled}
              onCheckedChange={(v) => void services().capsules.updateCapsule(capsule.id, { viewerEnabled: v }).then(() => toast.success(v ? "Family viewer on" : "Family viewer off"))}
              label="Family viewer"
              description="Invited viewers can explore approved, family-visible stories. Never publicly listed or indexed."
            />
          </div>
        </Panel>

        <Panel title="Stories by visibility">
          <ul className="space-y-3">
            {counts.map(([p, n]) => (
              <li key={p} className="flex items-center justify-between gap-3">
                <span>
                  <span className="block font-medium">{privacyCopy[p].label}</span>
                  <span className="text-[0.8125rem] text-ink-3">{privacyCopy[p].description}</span>
                </span>
                <span className="font-serif text-[1.8rem]">{n}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[0.875rem] text-ink-3">Change an individual story&rsquo;s visibility from its editor, including sharing it with selected people only. Contributors also choose whether their story may be printed or shared.</p>
        </Panel>
      </div>

      <Panel title="Who has access" description="Roles for this capsule. The owner manages billing and deletion." bodyClassName="p-3 sm:p-3">
        <ul>
          {memberships.map((m) => {
            const p = people.find((x) => x.id === m.personId);
            return (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] p-3">
                <span className="flex items-center gap-3">
                  <Avatar name={p?.displayName ?? "?"} size="sm" />
                  <span>
                    <span className="block font-medium">{p?.displayName}</span>
                    <span className="text-[0.8125rem] text-ink-3">{roleLabels[m.role].description}</span>
                  </span>
                </span>
                {m.role === "owner" ? (
                  <Badge tone="brand">Owner</Badge>
                ) : (
                  <Select value={m.role} onChange={(e) => setRole(m.id, e.target.value as Role)} aria-label={`Role for ${p?.displayName}`} className="h-10 w-44 rounded-full text-[0.875rem]">
                    {ROLES.filter((r) => r !== "owner").map((r) => (
                      <option key={r} value={r}>
                        {roleLabels[r].label}
                      </option>
                    ))}
                  </Select>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="What each role can do" bodyClassName="p-0 sm:p-0">
        <AccessMatrix />
      </Panel>

      <Panel title="Places" description="Places are stored at city or landmark level. Hide any you'd rather not show on the map.">
        <ul className="divide-y divide-line">
          {usedPlaces.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
              <span>
                <span className="font-medium">{p.name}</span>
                <span className="ml-2 text-[0.8125rem] text-ink-3">{p.precision === "landmark" ? "Public landmark" : "City-level"}</span>
              </span>
              <Select
                value={p.visibility}
                aria-label={`Visibility for ${p.name}`}
                className="h-10 w-48 rounded-full text-[0.875rem]"
                onChange={(e) =>
                  mutate((d) => {
                    const x = d.places.find((y) => y.id === p.id);
                    if (x) x.visibility = e.target.value as LocationVisibility;
                  })
                }
              >
                <option value="family">Show on map</option>
                <option value="organizers">Owner &amp; editors only</option>
                <option value="hidden">Hide from map</option>
              </Select>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Archive or delete" className="border-danger/25">
        {capsule.status === "deletion_pending" ? (
          <div className="space-y-4">
            <DemoNotice tone="warning" title="Deletion requested" icon={<Trash2 className="size-[18px]" />}>
              Requested {formatDate(capsule.deletionRequestedAt)}. With real storage there would be a 30-day grace period, after which files are erased from primary storage and backup copies expire on their own schedule. In this demo nothing has been erased, cancel any time, or use “Erase demo data” in Settings.
            </DemoNotice>
            <Button variant="secondary" leading={<RotateCcw className="size-4" />} onClick={() => void services().capsules.setCapsuleStatus(capsule.id, "active").then(() => toast.success("Deletion canceled"))}>
              Cancel deletion
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {capsule.status === "archived" ? (
              <Button variant="secondary" leading={<RotateCcw className="size-4" />} onClick={() => void services().capsules.setCapsuleStatus(capsule.id, "active").then(() => toast.success("Capsule reopened"))}>
                Reopen capsule
              </Button>
            ) : (
              <Button variant="secondary" leading={<Archive className="size-4" />} onClick={() => setConfirm("archive")}>
                Archive capsule
              </Button>
            )}
            <Button variant="ghost" className="text-danger" leading={<Trash2 className="size-4" />} onClick={() => setConfirm("delete")}>
              Request deletion
            </Button>
          </div>
        )}
        <p className="mt-4 text-[0.875rem] text-ink-3">Before deleting, download a copy from the Export tab. Contributors can also ask for their own stories to be removed.</p>
      </Panel>

      <ConfirmDialog
        open={confirm === "archive"}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Archive this capsule?"
        body="It becomes read-only: still viewable and exportable, but closed to new memories and invitations. You can reopen it any time."
        confirmLabel="Archive"
        onConfirm={async () => {
          await services().capsules.setCapsuleStatus(capsule.id, "archived");
          setConfirm(null);
          toast.success("Capsule archived");
        }}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={`Request deletion of ${capsule.subjectName}?`}
        tone="danger"
        confirmLabel="Request deletion"
        body={
          <>
            The capsule will be marked <strong>deletion pending</strong>. With real storage, a 30-day grace period lets you change your mind; afterwards files are erased and backup copies expire on their documented schedule. In this preview, the request is simulated and you can cancel it.
          </>
        }
        onConfirm={async () => {
          await services().capsules.setCapsuleStatus(capsule.id, "deletion_pending");
          setConfirm(null);
          toast.warning("Deletion requested", "Simulated, nothing has been erased.");
        }}
      />
    </div>
  );
}
