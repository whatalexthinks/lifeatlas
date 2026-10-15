"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { UserPlus } from "lucide-react";
import type { Person, RelationshipKind } from "@/domain/models";
import { useStudioCapsule } from "@/components/studio/capsule-frame";
import { Panel } from "@/components/studio/primitives";
import { Avatar } from "@/components/studio/persona-switcher";
import { Button } from "@/components/ui/button";
import { Badge, toast } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { Dialog } from "@/components/ui/overlay";
import { roleLabels } from "@/domain/policies/permissions";
import { useCapsuleMemories, useDb } from "@/hooks/use-data";
import { useDemoStore } from "@/store/demo-store";
import { cn, uid } from "@/lib/utils";

/** Generation of each person relative to the storyteller (0), via the relationship graph. */
function generations(rootId: string | undefined, people: Person[], rels: { fromPersonId: string; toPersonId: string; kind: RelationshipKind }[]) {
  const gen = new Map<string, number>();
  if (!rootId) return gen;
  gen.set(rootId, 0);
  const queue = [rootId];
  while (queue.length) {
    const cur = queue.shift()!;
    const g = gen.get(cur)!;
    for (const r of rels) {
      let other: string | null = null;
      let og = g;
      if (r.fromPersonId === cur) {
        other = r.toPersonId;
        og = r.kind === "parent" ? g + 1 : g;
      } else if (r.toPersonId === cur) {
        other = r.fromPersonId;
        og = r.kind === "parent" ? g - 1 : g;
      }
      if (other && !gen.has(other) && r.kind !== "friend") {
        gen.set(other, og);
        queue.push(other);
      }
    }
  }
  return gen;
}

export default function StudioPeople() {
  const { capsule } = useStudioCapsule();
  const people = useDb((d) => d.people);
  const rels = useDb((d) => d.relationships);
  const memberships = useDb((d) => d.memberships).filter((m) => m.capsuleId === capsule.id && m.status === "active");
  const memories = useCapsuleMemories(capsule.id, { scope: "studio" });
  const mutate = useDemoStore((s) => s.mutate);
  const [adding, setAdding] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", birthYear: "", relation: "child" as "parent" | "child" | "sibling" | "spouse" | "friend", note: "" });

  const gen = generations(capsule.subjectPersonId, people, rels);
  const rows = [...new Set([...gen.values()])].sort((a, b) => a - b);
  const genLabel = (g: number) => (g === -2 ? "Grandparents" : g === -1 ? "Parents" : g === 0 ? "Generation of " + capsule.preferredName : g === 1 ? "Children" : g === 2 ? "Grandchildren" : g < 0 ? "Earlier generations" : "Later generations");
  const relevant = people.filter((p) => gen.has(p.id) || memories.some((m) => m.peopleIds.includes(p.id) || m.attribution.personId === p.id) || memberships.some((x) => x.personId === p.id));
  const storyCount = (p: Person) => memories.filter((m) => m.peopleIds.includes(p.id)).length;
  const contributed = (p: Person) => memories.filter((m) => m.attribution.personId === p.id).length;

  const add = () => {
    const name = form.name.trim();
    if (!name) return;
    const id = uid("per");
    const now = new Date().toISOString();
    const [given, ...rest] = name.split(" ");
    mutate(
      (d) => {
        d.people.push({ id, displayName: name, givenName: given, familyName: rest.join(" "), birthYear: form.birthYear ? Number(form.birthYear) : undefined, shortBio: form.note || undefined, isSample: false, createdAt: now, updatedAt: now });
        const root = capsule.subjectPersonId;
        if (root) {
          const r =
            form.relation === "parent"
              ? { fromPersonId: id, toPersonId: root, kind: "parent" as const }
              : form.relation === "child"
                ? { fromPersonId: root, toPersonId: id, kind: "parent" as const }
                : { fromPersonId: id, toPersonId: root, kind: form.relation as "sibling" | "spouse" | "friend" };
          d.relationships.push({ id: uid("rel"), ...r });
        }
      },
      { actor: "Sarah Ellis", action: "person.added", target: id, detail: name },
    );
    toast.success(`${name} added to the family`);
    setAdding(false);
    setForm({ name: "", birthYear: "", relation: "child", note: "" });
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Family"
        description={capsule.subjectPersonId ? `Generations around ${capsule.preferredName}, from the relationships you've recorded.` : "Add people to build a family picture."}
        actions={
          <Button size="sm" variant="secondary" leading={<UserPlus className="size-4" />} onClick={() => setAdding(true)}>
            Add a person
          </Button>
        }
      >
        {rows.length ? (
          <div className="space-y-6">
            {rows.map((g) => (
              <div key={g}>
                <p className="catalog mb-2.5">{genLabel(g)}</p>
                <div className="flex flex-wrap gap-3">
                  {people
                    .filter((p) => gen.get(p.id) === g)
                    .map((p) => (
                      <div key={p.id} className={cn("flex min-w-[200px] items-center gap-3 rounded-[16px] border px-3.5 py-3", p.id === capsule.subjectPersonId ? "border-evergreen bg-evergreen-soft/60" : "border-line bg-surface")}>
                        <Avatar name={p.displayName} kind={p.id === capsule.subjectPersonId ? "organizer" : undefined} />
                        <div>
                          <p className="font-medium leading-tight">{p.displayName}</p>
                          <p className="catalog mt-0.5">
                            {p.birthYear ?? "?"}
                            {p.deathYear ? `–${p.deathYear}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
            {people.filter((p) => !gen.has(p.id) && relevant.includes(p)).length ? (
              <div>
                <p className="catalog mb-2.5">Friends & others</p>
                <div className="flex flex-wrap gap-3">
                  {people
                    .filter((p) => !gen.has(p.id) && relevant.includes(p))
                    .map((p) => (
                      <div key={p.id} className="flex min-w-[200px] items-center gap-3 rounded-[16px] border border-dashed border-line-strong bg-surface/60 px-3.5 py-3">
                        <Avatar name={p.displayName} />
                        <p className="font-medium">{p.displayName}</p>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-ink-3">No relationships recorded yet.</p>
        )}
      </Panel>

      <Panel title="People index" bodyClassName="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-line text-[0.8125rem] text-ink-3">
                <th className="px-6 py-3 font-medium">Person</th>
                <th className="px-3 py-3 font-medium">Years</th>
                <th className="px-3 py-3 font-medium">Appears in</th>
                <th className="px-3 py-3 font-medium">Contributed</th>
                <th className="px-6 py-3 font-medium">Role in this capsule</th>
              </tr>
            </thead>
            <tbody>
              {relevant.map((p) => {
                const roles = memberships.filter((m) => m.personId === p.id);
                return (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-6 py-3">
                      <span className="flex items-center gap-3">
                        <Avatar name={p.displayName} size="sm" />
                        <span>
                          <span className="block font-medium">{p.displayName}</span>
                          {p.shortBio ? <span className="block max-w-xs truncate text-[0.8125rem] text-ink-3">{p.shortBio}</span> : null}
                        </span>
                      </span>
                    </td>
                    <td className="catalog px-3 py-3">
                      {p.birthYear ?? "—"}
                      {p.deathYear ? `–${p.deathYear}` : ""}
                    </td>
                    <td className="px-3 py-3">
                      {storyCount(p) ? (
                        <Link href={`/app/capsules/${capsule.id}/memories?person=${p.id}`} className="text-evergreen hover:underline">
                          {storyCount(p)} {storyCount(p) === 1 ? "story" : "stories"}
                        </Link>
                      ) : (
                        <span className="text-ink-4">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">{contributed(p) || <span className="text-ink-4">—</span>}</td>
                    <td className="px-6 py-3">
                      <span className="flex flex-wrap gap-1.5">
                        {roles.length ? roles.map((r) => <Badge key={r.id} tone={r.role === "owner" ? "brand" : "neutral"}>{roleLabels[r.role].label}</Badge>) : <span className="text-ink-4">Not a member</span>}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Dialog
        open={adding}
        onOpenChange={setAdding}
        title="Add a person"
        description="Names and years only. No addresses, phone numbers or other contact details are stored in capsules."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={add} disabled={!form.name.trim()}>
              Add person
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Name" htmlFor="p-name">
            <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Year born" htmlFor="p-year" optional>
            <Input id="p-year" type="number" inputMode="numeric" value={form.birthYear} onChange={(e) => setForm({ ...form, birthYear: e.target.value })} />
          </Field>
          <Field label={`Relationship to ${capsule.preferredName}`} htmlFor="p-rel">
            <Select id="p-rel" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value as typeof form.relation })}>
              <option value="parent">Parent</option>
              <option value="child">Child</option>
              <option value="sibling">Sibling</option>
              <option value="spouse">Spouse or partner</option>
              <option value="friend">Friend</option>
            </Select>
          </Field>
          <Field label="A short note" htmlFor="p-note" optional>
            <Input id="p-note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={140} />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}
