"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "@/lib/router/navigation";
import { Check, Copy, ExternalLink, Eye, ListChecks, Mail, MailPlus, MessageSquare, RefreshCw, RotateCcw, ShieldAlert, X } from "lucide-react";
import type { Invitation, Memory } from "@/domain/models";
import { invitationSchema, type InvitationFormValues } from "@/domain/schemas";
import { PageHeader, InvitationStatusBadge, Panel } from "@/components/studio/primitives";
import { MemoryEditorSheet } from "@/components/studio/memory-editor";
import { QuestionPicker } from "@/components/capsule/question-picker";
import { AudioPlayer } from "@/components/audio/audio-player";
import { MediaImage } from "@/components/media/media-image";
import { Button } from "@/components/ui/button";
import { Badge, DemoNotice, EmptyState, toast } from "@/components/ui/feedback";
import { ChoiceCards, Field, Input, Segmented, Select, Textarea } from "@/components/ui/field";
import { Dialog } from "@/components/ui/overlay";
import { useDb } from "@/hooks/use-data";
import { services } from "@/services/factory";
import { InvitationPoints } from "@/components/contribute/invitation-points";
import { explainInvitation } from "@/domain/invitations";
import type { MessagePreview } from "@/services/contracts";
import { formatFuzzyDate } from "@/lib/dates";
import { cn, formatDate, relativeTime } from "@/lib/utils";
import { roleLabels } from "@/domain/policies/permissions";
import { brand } from "@/config/brand";

function InvitationsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const invitations = useDb((d) => d.invitations);
  const capsules = useDb((d) => d.capsules);
  const memories = useDb((d) => d.memories);
  const personas = useDb((d) => d.personas);
  const [tab, setTab] = React.useState<"invitations" | "review">(params.get("tab") === "review" ? "review" : "invitations");
  const [creating, setCreating] = React.useState(params.get("new") === "1");
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const [openMemory, setOpenMemory] = React.useState<string | null>(params.get("memory"));
  const [filterCapsule, setFilterCapsule] = React.useState<string>("");

  const queue = memories.filter((m) => !m.deletedAt && (m.status === "submitted" || m.status === "under_review")).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const returned = memories.filter((m) => !m.deletedAt && (m.status === "returned" || m.status === "declined"));
  const list = invitations.filter((i) => !filterCapsule || i.capsuleId === filterCapsule);
  const editing = memories.find((m) => m.id === openMemory);
  const editingCapsule = capsules.find((c) => c.id === editing?.capsuleId);

  const openAsRecipient = async (inv: Invitation) => {
    if (inv.status === "prepared") await services().communications.simulateSend(inv.id);
    const persona = personas.find((p) => p.personId && p.personId === inv.personId);
    if (persona) await services().auth.switchPersona(persona.id);
    else toast.info("Opening as the recipient", "This person has no demo identity — you'll see their invitation as a guest.");
    router.push(`/contribute/${inv.token}`);
  };

  return (
    <div className="mx-auto max-w-[1240px]">
      <PageHeader
        eyebrow="Family collaboration"
        title="Invitations & review"
        description="Invite people to add what only they remember. Nothing they send appears in the archive until you approve it."
        actions={
          <Button leading={<MailPlus className="size-4" />} onClick={() => setCreating(true)}>
            New invitation
          </Button>
        }
      />
      <Segmented
        label="Section"
        value={tab}
        onChange={setTab}
        className="mb-8"
        options={[
          { value: "invitations", label: `Invitations ${invitations.length}` },
          { value: "review", label: `Waiting for review ${queue.length}` },
        ]}
      />

      {tab === "review" ? (
        <div className="space-y-6">
          {queue.length === 0 ? (
            <EmptyState title="You're all caught up" body="When someone you invite sends a story, it waits here for you to read first." />
          ) : (
            queue.map((m) => <ReviewCard key={m.id} memory={m} capsuleName={capsules.find((c) => c.id === m.capsuleId)?.subjectName ?? ""} onOpen={() => setOpenMemory(m.id)} />)
          )}
          {returned.length ? (
            <Panel title="Returned or not included" bodyClassName="p-3 sm:p-3">
              {returned.map((m) => (
                <button key={m.id} onClick={() => setOpenMemory(m.id)} className="flex w-full items-center justify-between gap-3 rounded-[12px] p-3 text-left hover:bg-ivory/70">
                  <span>
                    <span className="block font-serif text-[1.15rem]">{m.title}</span>
                    <span className="text-[0.8125rem] text-ink-3">
                      From {m.attribution.displayName}
                      {m.reviewNote ? ` · “${m.reviewNote}”` : ""}
                    </span>
                  </span>
                  <Badge tone={m.status === "returned" ? "warning" : "neutral"}>{m.status === "returned" ? "Returned" : "Not included"}</Badge>
                </button>
              ))}
            </Panel>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={filterCapsule} onChange={(e) => setFilterCapsule(e.target.value)} aria-label="Filter by capsule" className="h-10 w-56 rounded-full text-[0.875rem]">
              <option value="">All capsules</option>
              {capsules.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.subjectName}
                </option>
              ))}
            </Select>
            <p className="text-[0.875rem] text-ink-3">Email and text delivery aren&rsquo;t connected — you share each link yourself.</p>
          </div>
          {list.length === 0 ? (
            <EmptyState title="No invitations yet" body="Invite a storyteller, a sibling, or the cousin with the shoebox of slides." action={<Button onClick={() => setCreating(true)}>New invitation</Button>} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {list.map((inv) => {
                const c = capsules.find((x) => x.id === inv.capsuleId);
                const contributions = memories.filter((m) => m.attribution.invitationId === inv.id && !m.deletedAt).length;
                return (
                  <article key={inv.id} className="card-paper flex flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-serif text-[1.5rem] leading-tight">{inv.recipientName}</p>
                        <p className="mt-0.5 text-[0.875rem] text-ink-3">
                          {inv.relationship} · {roleLabels[inv.role].label} · for {c?.preferredName}
                        </p>
                      </div>
                      <InvitationStatusBadge status={inv.status} />
                    </div>
                    {inv.message ? <p className="mt-4 line-clamp-2 font-serif italic text-ink-2">&ldquo;{inv.message}&rdquo;</p> : null}
                    <dl className="mt-4 grid grid-cols-3 gap-3 text-[0.8125rem]">
                      <div>
                        <dt className="text-ink-4">Channel</dt>
                        <dd className="mt-0.5 inline-flex items-center gap-1">{inv.channel === "email" ? <Mail className="size-3.5" /> : inv.channel === "sms" ? <MessageSquare className="size-3.5" /> : <Copy className="size-3.5" />} {inv.channel === "link" ? "Shared link" : inv.channel === "sms" ? "Text" : "Email"}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-4">Questions</dt>
                        <dd className="mt-0.5">{inv.mode === "open" ? "Open" : inv.questionIds.length}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-4">Contributions</dt>
                        <dd className="mt-0.5">{contributions}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-[0.75rem] text-ink-4">
                      {inv.status.endsWith("_demo") || inv.status === "prepared" || inv.status === "simulated_sent" ? `Link expires ${formatDate(inv.expiresAt)}` : null} · last change {relativeTime(inv.updatedAt)}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-5">
                      <Button size="sm" variant="secondary" leading={<Eye className="size-4" />} onClick={() => setPreviewId(inv.id)}>
                        Preview & copy
                      </Button>
                      {inv.status !== "revoked_demo" && inv.status !== "expired_demo" ? (
                        <Button size="sm" variant="ghost" leading={<ExternalLink className="size-4" />} onClick={() => void openAsRecipient(inv)}>
                          Open as {inv.recipientName.split(" ")[0]}
                        </Button>
                      ) : null}
                      {inv.status === "revoked_demo" || inv.status === "expired_demo" ? (
                        <Button size="sm" variant="ghost" leading={<RefreshCw className="size-4" />} onClick={async () => (await services().communications.reissue(inv.id), toast.success("New link issued", "The old link no longer opens."))}>
                          Issue a new link
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger"
                          leading={<X className="size-4" />}
                          onClick={async () => {
                            const r = await services().communications.revoke(inv.id);
                            if (r.status === "ok") toast.success("Link revoked", "It no longer opens in this demo.");
                            else toast.error("Couldn't revoke", r.status === "error" ? r.message : undefined);
                          }}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      <NewInvitationDialog open={creating} onOpenChange={setCreating} defaultCapsule={params.get("capsule") ?? undefined} defaultQuestions={params.get("questions")?.split(",").filter(Boolean)} onCreated={(id) => setPreviewId(id)} />
      <PreviewDialog invitationId={previewId} onClose={() => setPreviewId(null)} onOpenAs={openAsRecipient} />
      {editing && editingCapsule ? <MemoryEditorSheet memory={editing} capsule={editingCapsule} open onOpenChange={(v) => !v && setOpenMemory(null)} /> : null}
    </div>
  );
}

function ReviewCard({ memory, capsuleName, onOpen }: { memory: Memory; capsuleName: string; onOpen: () => void }) {
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const act = async (to: Memory["status"], label: string) => {
    setBusy(to);
    const r = await services().capsules.transitionMemory(memory.id, to, note || undefined, "Sarah Ellis");
    setBusy(null);
    if (r.status === "ok") toast.success(label);
    else toast.error("Not possible", r.status === "error" ? r.message : undefined);
  };
  return (
    <article className="card-paper overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={memory.status === "under_review" ? "info" : "warning"} dot>
              {memory.status === "under_review" ? "In review" : "New"}
            </Badge>
            <span className="text-[0.875rem] text-ink-3">
              For {capsuleName} · from {memory.attribution.displayName}
              {memory.attribution.relationship ? ` (${memory.attribution.relationship.toLowerCase()})` : ""} · {relativeTime(memory.createdAt)}
            </span>
          </div>
          <p className="catalog mt-4">{formatFuzzyDate(memory.date)}</p>
          <h2 className="mt-1 font-serif text-[1.9rem] leading-tight">{memory.title}</h2>
          <p className="mt-3 whitespace-pre-line text-[1rem] leading-relaxed text-ink-2">{memory.narrative || "(No written text — see the recording or photo.)"}</p>
          {memory.audioId ? <AudioPlayer mediaId={memory.audioId} title={memory.title} className="mt-5" showNotice={false} /> : null}
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the contributor" className="mt-5 min-h-20 text-[0.9375rem]" aria-label="Note for the contributor" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button leading={<Check className="size-4" />} loading={busy === "approved"} onClick={() => void act("approved", "Approved — now in the archive")}>
              Approve
            </Button>
            <Button variant="secondary" leading={<RotateCcw className="size-4" />} loading={busy === "returned"} onClick={() => void act("returned", "Returned with your note")}>
              Return with note
            </Button>
            <Button variant="ghost" loading={busy === "declined"} onClick={() => void act("declined", "Not included")}>
              Don&rsquo;t include
            </Button>
            <Button variant="ghost" onClick={onOpen}>
              Edit first
            </Button>
          </div>
        </div>
        {memory.photoIds[0] ? (
          <div className="relative min-h-56 bg-linen">
            <MediaImage mediaId={memory.photoIds[0]} className="absolute inset-0" />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function NewInvitationDialog({ open, onOpenChange, defaultCapsule, defaultQuestions, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; defaultCapsule?: string; defaultQuestions?: string[]; onCreated: (id: string) => void }) {
  const capsules = useDb((d) => d.capsules).filter((c) => c.status === "active" || c.status === "draft");
  const questions = useDb((d) => d.questions);
  const memories = useDb((d) => d.memories);
  const inviterName = useDb((d) => d.account.profile.displayName);
  const [capsuleId, setCapsuleId] = React.useState(defaultCapsule ?? capsules[0]?.id ?? "");
  const [values, setValues] = React.useState<InvitationFormValues>({
    recipientName: "",
    recipientContact: "",
    relationship: "",
    role: "contributor",
    channel: "link",
    message: "",
    mode: defaultQuestions?.length ? "questions" : "questions",
    questionIds: defaultQuestions ?? ["q_moments_1", "q_traditions_3", "q_descendants_2"],
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [picker, setPicker] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const set = (p: Partial<InvitationFormValues>) => setValues((v) => ({ ...v, ...p }));
  const capsule = capsules.find((c) => c.id === capsuleId);
  const contributorMedia = memories.filter((m) => m.capsuleId === capsuleId && m.status === "approved" && m.privacy === "family" && m.attribution.via === "invitation" && m.photoIds.length).length;

  const submit = async () => {
    const r = invitationSchema.safeParse(values);
    if (!r.success) {
      const e: Record<string, string> = {};
      for (const i of r.error.issues) e[String(i.path[0])] ??= i.message;
      setErrors(e);
      return;
    }
    setBusy(true);
    const res = await services().communications.prepareInvitation(capsuleId, r.data);
    setBusy(false);
    if (res.status === "ok") {
      toast.success("Invitation ready", "Preview it, then copy the link to share.");
      onOpenChange(false);
      onCreated(res.data.id);
      setValues((v) => ({ ...v, recipientName: "", recipientContact: "", relationship: "", message: "" }));
    } else toast.error("Couldn't prepare the invitation", res.status === "error" ? res.message : undefined);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New invitation"
      description="Prepare a private link. You'll preview the message before sharing it yourself."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} loading={busy}>
            Prepare invitation
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="For which capsule?" htmlFor="i-capsule">
            <Select id="i-capsule" value={capsuleId} onChange={(e) => setCapsuleId(e.target.value)}>
              {capsules.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.subjectName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Their name" htmlFor="i-name" error={errors.recipientName}>
            <Input id="i-name" value={values.recipientName} onChange={(e) => set({ recipientName: e.target.value })} invalid={!!errors.recipientName} />
          </Field>
          <Field label="How are they related?" htmlFor="i-rel" error={errors.relationship}>
            <Input id="i-rel" value={values.relationship} onChange={(e) => set({ relationship: e.target.value })} placeholder="Cousin, son, old friend…" invalid={!!errors.relationship} />
          </Field>
          <Field label="Email" htmlFor="i-contact" optional hint="Only used for the preview. Nothing is sent." error={errors.recipientContact}>
            <Input id="i-contact" type="email" value={values.recipientContact ?? ""} onChange={(e) => set({ recipientContact: e.target.value })} placeholder="name@example.com" invalid={!!errors.recipientContact} />
          </Field>
        </div>
        <div>
          <p className="mb-3 font-medium">Their role</p>
          <ChoiceCards
            name="role"
            value={values.role}
            onChange={(v) => set({ role: v })}
            columns={2}
            options={[
              { value: "contributor", label: "Contributor", description: "Adds stories, photos or recordings" },
              { value: "storyteller", label: "Storyteller", description: "The person whose life this is" },
              { value: "viewer", label: "Viewer", description: "Explores approved stories only" },
              { value: "organizer", label: "Editor", description: "Helps you run it: edits, invites, reviews" },
            ]}
          />
          <p className="mt-3 text-[0.875rem] text-ink-3">Everyone you invite joins free. Only you, as the owner, pay for the plan.</p>
        </div>
        {values.role !== "viewer" && values.role !== "organizer" ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium">What should they answer?</p>
              <Segmented
                label="Invitation type"
                size="sm"
                value={values.mode}
                onChange={(m) => set({ mode: m })}
                options={[
                  { value: "questions", label: "A few questions" },
                  { value: "open", label: "Anything they like" },
                ]}
              />
            </div>
            {values.mode === "questions" ? (
              <div className="rounded-[16px] border border-line p-4">
                <ol className="space-y-1.5">
                  {values.questionIds.map((id, i) => (
                    <li key={id} className="flex gap-3 font-serif text-[1.1rem] leading-snug">
                      <span className="catalog mt-1">{String(i + 1).padStart(2, "0")}</span>
                      {questions.find((q) => q.id === id)?.text}
                    </li>
                  ))}
                </ol>
                <Button size="sm" variant="secondary" className="mt-4" leading={<ListChecks className="size-4" />} onClick={() => setPicker(true)}>
                  Change questions
                </Button>
                {errors.questionIds ? <p className="mt-2 text-[0.875rem] text-danger">{errors.questionIds}</p> : null}
              </div>
            ) : null}
          </div>
        ) : contributorMedia ? (
          <DemoNotice tone="warning" title="Before you share" icon={<ShieldAlert className="size-[18px]" />}>
            Viewers will see {contributorMedia} family-visible {contributorMedia === 1 ? "story" : "stories"} that include photos other relatives contributed. Private stories stay hidden. Check the Privacy tab if anything should be for the owner and editors only.
          </DemoNotice>
        ) : null}
        <Field label="A personal note" htmlFor="i-msg" optional hint="It appears at the top of their invitation." error={errors.message}>
          <Textarea id="i-msg" value={values.message} onChange={(e) => set({ message: e.target.value })} className="min-h-24" maxLength={1000} placeholder={capsule ? `You remember things about ${capsule.preferredName} that no one else does…` : ""} />
        </Field>
        <div>
          <p className="mb-3 font-medium">How you&rsquo;ll share it</p>
          <Segmented
            label="Channel"
            value={values.channel}
            onChange={(c) => set({ channel: c })}
            options={[
              { value: "link", label: "Copy a link" },
              { value: "email", label: "Email (preview)" },
              { value: "sms", label: "Text (preview)" },
            ]}
          />
        </div>
        {capsule ? (
          <details className="group rounded-[16px] border border-line bg-paper/60 p-4">
            <summary className="cursor-pointer list-none font-medium [&::-webkit-details-marker]:hidden">
              What {values.recipientName.trim().split(" ")[0] || "they"} will be told <span className="font-normal text-ink-3">— who&rsquo;s asking, what it is, the ask, the cost, and how it&rsquo;s used</span>
            </summary>
            <InvitationPoints
              size="sm"
              className="mt-4"
              points={explainInvitation({
                invitation: values,
                capsule,
                inviterName,
                questions: values.mode === "questions" ? values.questionIds.map((id) => questions.find((q) => q.id === id)?.text).filter((t): t is string => !!t) : [],
                storyCount: memories.filter((m) => m.capsuleId === capsule.id && !m.deletedAt && m.status === "approved").length,
              })}
            />
          </details>
        ) : null}
      </div>
      <QuestionPicker open={picker} onOpenChange={setPicker} selected={values.questionIds} onConfirm={(ids) => set({ questionIds: ids })} max={12} />
    </Dialog>
  );
}

function PreviewDialog({ invitationId, onClose, onOpenAs }: { invitationId: string | null; onClose: () => void; onOpenAs: (inv: Invitation) => void }) {
  const invitation = useDb((d) => d.invitations.find((i) => i.id === invitationId));
  const [preview, setPreview] = React.useState<MessagePreview | null>(null);
  const [view, setView] = React.useState<"email" | "sms">("email");
  React.useEffect(() => {
    if (!invitationId) return;
    services()
      .communications.preview(invitationId, window.location.origin)
      .then((r) => r.status === "ok" && setPreview(r.data));
  }, [invitationId, invitation?.token]);
  if (!invitation) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(preview?.link ?? "");
    } catch {
      /* clipboard unavailable */
    }
    if (invitation.status === "prepared") await services().communications.simulateSend(invitation.id);
    toast.success("Link copied", `Share it however you like. ${brand.name} didn't send anything.`);
  };
  return (
    <Dialog
      open={!!invitationId}
      onOpenChange={(v) => !v && onClose()}
      title={`Invitation for ${invitation.recipientName}`}
      description="This is exactly what they'd receive. Nothing is sent from this preview."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenAs(invitation)}>
            Open as {invitation.recipientName.split(" ")[0]}
          </Button>
          <Button leading={<Copy className="size-4" />} onClick={() => void copy()}>
            Copy link
          </Button>
        </>
      }
    >
      <Segmented
        label="Message format"
        value={view}
        onChange={setView}
        className="mb-5"
        options={[
          { value: "email", label: "Email", icon: <Mail className="size-4" /> },
          { value: "sms", label: "Text message", icon: <MessageSquare className="size-4" /> },
        ]}
      />
      {preview ? (
        view === "email" ? (
          <div className="overflow-hidden rounded-[16px] border border-line">
            <div className="space-y-1 border-b border-line bg-ivory/60 px-5 py-3 text-[0.8125rem]">
              <p>
                <span className="text-ink-3">To:</span> {invitation.recipientContact || `${invitation.recipientName} (you'll share the link yourself)`}
              </p>
              <p>
                <span className="text-ink-3">Subject:</span> <span className="font-medium">{preview.subject}</span>
              </p>
            </div>
            <div className="bg-surface px-6 py-6">
              <p className="whitespace-pre-line font-serif text-[1.1rem] leading-relaxed text-ink">{preview.body}</p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-sm rounded-[24px] bg-ivory p-5">
            <p className="ml-auto max-w-[85%] rounded-[18px] rounded-br-[6px] bg-evergreen px-4 py-3 text-[0.9375rem] leading-snug text-on-evergreen">{preview.sms}</p>
          </div>
        )
      ) : null}
      <div className="mt-5 flex items-center gap-2 rounded-[12px] border border-line bg-surface px-3 py-2">
        <code className="min-w-0 flex-1 truncate font-mono text-[0.8125rem] text-ink-2">{preview?.link}</code>
        <InvitationStatusBadge status={invitation.status} />
      </div>
      <DemoNotice className="mt-5" title="Invitation preview — no email sent">
        Copying marks the invitation as shared in this demo. Real delivery, secure single-use links and expiry enforcement arrive in a later release.
      </DemoNotice>
      <ol className={cn("mt-6 space-y-2 border-l border-line pl-4 text-[0.8125rem] text-ink-3")}>
        {invitation.history
          .slice()
          .reverse()
          .map((h, i) => (
            <li key={i}>
              <span className="font-medium text-ink-2">{h.status.replace(/_/g, " ")}</span> · {relativeTime(h.at)}
              {h.note ? ` — ${h.note}` : ""}
            </li>
          ))}
      </ol>
    </Dialog>
  );
}

export default function InvitationsPage() {
  return (
    <Suspense fallback={null}>
      <InvitationsInner />
    </Suspense>
  );
}
