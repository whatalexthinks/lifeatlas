"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Info, Lock, MailPlus, Minus } from "lucide-react";
import type { Role } from "@/domain/models";
import { accessMatrix, can, roleLabels } from "@/domain/policies/permissions";
import { PageHeader, Panel, Stat } from "@/components/studio/primitives";
import { Avatar } from "@/components/studio/persona-switcher";
import { ButtonLink } from "@/components/ui/button";
import { Badge, toast } from "@/components/ui/feedback";
import { useDb } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { cn } from "@/lib/utils";

const assignable: Role[] = ["organizer", "contributor", "viewer", "successor"];
const matrixRoles: Role[] = ["owner", "organizer", "storyteller", "contributor", "viewer", "successor"];

export default function FamilyPage() {
  const group = useDb((d) => d.familyGroups[0]);
  const capsules = useDb((d) => d.capsules);
  const people = useDb((d) => d.people);
  const memberships = useDb((d) => d.memberships);
  const invitations = useDb((d) => d.invitations);
  const [saving, setSaving] = React.useState<string | null>(null);

  const active = memberships.filter((m) => m.status === "active");
  const groupCapsules = capsules.filter((c) => !group || group.capsuleIds.includes(c.id) || c.familyGroupId === group.id);
  // Everyone with a role somewhere, plus the people the capsules are about.
  const memberIds = new Set([...active.map((m) => m.personId), ...groupCapsules.map((c) => c.subjectPersonId).filter(Boolean)] as string[]);
  const members = people.filter((p) => memberIds.has(p.id)).sort((a, b) => a.familyName.localeCompare(b.familyName) || a.givenName.localeCompare(b.givenName));
  const pending = invitations.filter((i) => i.status === "prepared" || i.status === "simulated_sent");

  const setRole = async (capsuleId: string, personId: string, role: Role | null, name: string, capsuleName: string) => {
    setSaving(`${capsuleId}:${personId}`);
    const r = await services().capsules.setMemberRole(capsuleId, personId, role);
    setSaving(null);
    if (r.status === "ok") toast.success(role ? `${name} is now ${roleLabels[role].label.toLowerCase()} on ${capsuleName}` : `${name} removed from ${capsuleName}`, "Saved on this device. No one was notified.");
    else toast.error(r.status === "error" ? r.message : "Couldn't change the role");
  };

  return (
    <div className="mx-auto max-w-[1240px]">
      <PageHeader
        eyebrow="Family collection"
        title={group?.name ?? "Your family"}
        description={group?.description ?? "Everyone who helps keep these stories, and what each of them can do."}
        actions={
          <ButtonLink href="/app/invitations" leading={<MailPlus className="size-4" />}>
            Invite someone
          </ButtonLink>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Capsules" value={groupCapsules.length} />
        <Stat label="People" value={members.length} />
        <Stat label="Contributors" value={new Set(active.filter((m) => m.role === "contributor").map((m) => m.personId)).size} />
        <Stat label="Invitations waiting" value={pending.length} hint={pending.length ? "Previews only — not sent" : undefined} />
      </div>

      <div className="mb-8 flex gap-3 rounded-[14px] bg-info-soft px-5 py-4 text-[0.9375rem]">
        <Info className="mt-0.5 size-5 shrink-0 text-info" />
        <p className="text-ink-2">
          <strong className="font-medium text-ink">Roles are demonstrated, not enforced.</strong> Everyone in this preview uses the same browser. Secure sign-in and real access control come with accounts — until then, use the persona switcher to see each view.
        </p>
      </div>

      <Panel title="Who can do what, where" description="Change a role and the studio, viewer and invitations follow it immediately." bodyClassName="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[0.9375rem]">
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="sticky left-0 z-[1] bg-surface px-6 py-3 text-[0.8125rem] font-normal text-ink-3">
                  Person
                </th>
                {groupCapsules.map((c) => (
                  <th key={c.id} scope="col" className="px-3 py-3 text-[0.8125rem] font-normal text-ink-3">
                    <Link href={`/app/capsules/${c.id}`} className="hover:text-ink hover:underline">
                      {c.subjectName}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {members.map((p) => (
                <tr key={p.id}>
                  <th scope="row" className="sticky left-0 z-[1] bg-surface px-6 py-3 text-left font-normal">
                    <span className="flex items-center gap-3">
                      <Avatar name={p.displayName} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{p.displayName}</span>
                        {p.shortBio ? <span className="block truncate text-[0.8125rem] text-ink-3">{p.shortBio}</span> : null}
                      </span>
                    </span>
                  </th>
                  {groupCapsules.map((c) => {
                    const m = active.find((x) => x.capsuleId === c.id && x.personId === p.id);
                    const isSubject = c.subjectPersonId === p.id;
                    const busy = saving === `${c.id}:${p.id}`;
                    if (m?.role === "owner")
                      return (
                        <td key={c.id} className="px-3 py-3">
                          <Badge tone="brand">
                            <Lock className="size-3" /> Owner
                          </Badge>
                        </td>
                      );
                    const options: Role[] = isSubject ? ["storyteller", ...assignable] : assignable;
                    return (
                      <td key={c.id} className="px-3 py-3">
                        <select
                          aria-label={`${p.displayName}'s role on ${c.subjectName}'s capsule`}
                          value={m?.role ?? ""}
                          disabled={busy}
                          onChange={(e) => void setRole(c.id, p.id, (e.target.value || null) as Role | null, p.givenName, `${c.subjectName.split(" ")[0]}'s capsule`)}
                          className={cn("h-9 min-w-[9.5rem] rounded-[8px] border bg-surface px-2.5 text-[0.875rem] transition", m ? "border-line-strong text-ink" : "border-dashed border-line text-ink-4", busy && "opacity-50")}
                        >
                          <option value="">No access</option>
                          {options.map((r) => (
                            <option key={r} value={r}>
                              {roleLabels[r].label}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="What each role can do" className="mt-6" bodyClassName="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[0.875rem]">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="px-6 py-3 text-left font-normal text-ink-3">
                  <span className="sr-only">Capability</span>
                </th>
                {matrixRoles.map((r) => (
                  <th key={r} scope="col" className="px-2 py-3 text-center font-medium">
                    <span title={roleLabels[r].description}>{roleLabels[r].label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {accessMatrix.map((row) => (
                <tr key={row.capability}>
                  <th scope="row" className="px-6 py-2.5 text-left font-normal text-ink-2">
                    {row.label}
                  </th>
                  {matrixRoles.map((r) => (
                    <td key={r} className="px-2 py-2.5 text-center">
                      {can(r, row.capability) ? <Check className="mx-auto size-4 text-evergreen" aria-label="Yes" /> : <Minus className="mx-auto size-4 text-ink-4/60" aria-label="No" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="grid gap-x-8 gap-y-3 border-t border-line px-6 py-5 text-[0.875rem] sm:grid-cols-2 lg:grid-cols-3">
          {matrixRoles.map((r) => (
            <div key={r}>
              <dt className="font-medium">{roleLabels[r].label}</dt>
              <dd className="text-ink-3">{roleLabels[r].description}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
