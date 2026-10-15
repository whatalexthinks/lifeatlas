"use client";

import * as React from "react";
import Link from "@/lib/router/link";
import { ArrowDown, ArrowUp, Bookmark, Check, ListPlus, MailPlus, Mic, Plus, RotateCcw, Shuffle, SkipForward, Star, Trash2, Undo2 } from "lucide-react";
import { askingWhom, capsuleKind, surpriseQuestion } from "@/domain/capsule-kinds";
import { useStudioCapsule } from "@/components/studio/capsule-frame";
import { QuestionPicker } from "@/components/capsule/question-picker";
import { Panel } from "@/components/studio/primitives";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState, toast } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/field";
import { useCapsuleMemories, useDb } from "@/hooks/use-data";
import { useDemoStore } from "@/store/demo-store";
import { questionCategories } from "@/data/prompts/questions";
import { services } from "@/services/factory";
import { cn, pluralize, uid } from "@/lib/utils";

export default function StudioQuestions() {
  const { capsule, openMemory } = useStudioCapsule();
  const assignments = useDb((d) => d.assignments).filter((a) => a.capsuleId === capsule.id);
  const questions = useDb((d) => d.questions);
  const collections = useDb((d) => d.questionCollections).filter((c) => c.capsuleId === capsule.id);
  const mutate = useDemoStore((s) => s.mutate);
  const [picker, setPicker] = React.useState(false);
  const [custom, setCustom] = React.useState("");
  const [customCat, setCustomCat] = React.useState<string>("Small Ordinary Moments");
  const [setName, setSetName] = React.useState("");
  const favorites = useDb((d) => d.questionFavorites);
  const memories = useCapsuleMemories(capsule.id, { scope: "studio" });
  const kind = capsuleKind(capsule);

  const queued = assignments.filter((a) => a.status === "queued").sort((a, b) => a.order - b.order);
  const answered = assignments.filter((a) => a.status === "answered");
  const skipped = assignments.filter((a) => a.status === "skipped");
  const saved = assignments.filter((a) => a.status === "saved");
  const qText = (id: string) => questions.find((q) => q.id === id)?.text ?? "Question";
  const answersTo = (id: string) => memories.filter((m) => m.questionId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  // Answered means a story answers it, whether or not it was ever queued.
  const answeredIds = [...new Set([...answered.map((a) => a.questionId), ...memories.filter((m) => m.questionId).map((m) => m.questionId!)])];
  const isFavorite = (id: string) => favorites.includes(id);
  const toggleFavorite = async (id: string) => {
    const r = await services().capsules.toggleFavoriteQuestion(id);
    if (r.status === "ok") toast.success(r.data ? "Added to your favourites" : "Removed from favourites");
  };

  // Surprise me: a question suited to this capsule that hasn't been used here yet.
  const used = new Set([...assignments.map((a) => a.questionId), ...answeredIds]);
  const [surpriseId, setSurpriseId] = React.useState<string | null>(null);
  const [seen, setSeen] = React.useState<string[]>([]);
  const surprise = questions.find((q) => q.id === surpriseId);
  const drawSurprise = () => {
    const exclude = new Set([...used, ...seen, ...(surpriseId ? [surpriseId] : [])]);
    const q = surpriseQuestion(kind, questions, exclude);
    if (!q) return;
    setSeen((x) => [...x, q.id]);
    setSurpriseId(q.id);
  };
  const enqueue = async (id: string) => {
    await services().capsules.setAssignments(capsule.id, [...queued.map((a) => a.questionId).filter((x) => x !== id), id]);
    toast.success("Added to Up next");
  };

  const reorder = async (i: number, d: -1 | 1) => {
    const ids = queued.map((a) => a.questionId);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await services().capsules.setAssignments(capsule.id, ids);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[22px] bg-night p-6 text-night-ink sm:p-7" aria-labelledby="surprise-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="surprise-title" className="font-mono text-[0.75rem] uppercase tracking-[0.14em] text-night-accent">
              A question for {askingWhom(capsule)}
            </h2>
            <button type="button" onClick={drawSurprise} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-night-line px-4 text-[0.875rem] font-medium hover:bg-white/10">
              <Shuffle className="size-4" aria-hidden /> {surprise ? "Another" : "Surprise me"}
            </button>
          </div>
          <div role="status" aria-label="Surprise question">
            {surprise ? (
              <>
                <p className="mt-4 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-night-ink-3">{surprise.category}</p>
                <p className="mt-2 font-serif text-[clamp(1.5rem,1.25rem+1vw,2rem)] leading-[1.15]">{surprise.text}</p>
              </>
            ) : (
              <p className="mt-4 text-[1rem] leading-relaxed text-night-ink-2">Not sure what to ask next? Press Surprise me for a question written for this kind of capsule, one you haven&rsquo;t used here yet.</p>
            )}
          </div>
          {surprise ? (
            <div className="mt-6 flex flex-wrap gap-2">
              <ButtonLink href={`/app/gather?capsule=${capsule.id}&question=${surprise.id}`} variant="light" size="sm" leading={<Mic className="size-4" />}>
                Answer now
              </ButtonLink>
              <Button size="sm" variant="outlineLight" onClick={() => void enqueue(surprise.id).then(() => setSurpriseId(null))} leading={<ListPlus className="size-4" />}>
                Add to Up next
              </Button>
              <Button size="sm" variant="outlineLight" onClick={() => void services().capsules.markAssignment(capsule.id, surprise.id, "saved").then(() => (toast.success("Saved for later"), setSurpriseId(null)))} leading={<Bookmark className="size-4" />}>
                Save for later
              </Button>
              <Button size="sm" variant="outlineLight" aria-pressed={isFavorite(surprise.id)} onClick={() => void toggleFavorite(surprise.id)} leading={<Star className={cn("size-4", isFavorite(surprise.id) && "fill-current")} />}>
                {isFavorite(surprise.id) ? "Favourite" : "Add to favourites"}
              </Button>
            </div>
          ) : null}
        </section>

        <Panel
          title="Up next"
          description="The order questions are offered in, in person or by link."
          actions={
            <Button size="sm" variant="secondary" leading={<ListPlus className="size-4" />} onClick={() => setPicker(true)}>
              Add from library
            </Button>
          }
        >
          {queued.length === 0 ? (
            <EmptyState className="py-10" title="No questions queued" body={`Choose a few from the library of ${questions.length}, press Surprise me, or write your own.`} />
          ) : (
            <ol className="space-y-2">
              {queued.map((a, i) => (
                <li key={a.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 rounded-[16px] border border-line bg-surface p-4">
                  <span className="catalog mt-1 w-5">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1 basis-[calc(100%-2rem)] font-serif text-[1.25rem] leading-snug sm:basis-0">{qText(a.questionId)}</span>
                  {/* On phones the actions drop below the question so it can use the full width. */}
                  <span className="-ml-2 flex shrink-0 items-center pl-8 sm:ml-0 sm:pl-0">
                    <button className="grid size-8 place-items-center rounded-full hover:bg-ivory disabled:opacity-30" disabled={i === 0} onClick={() => void reorder(i, -1)} aria-label="Move earlier">
                      <ArrowUp className="size-4" />
                    </button>
                    <button className="grid size-8 place-items-center rounded-full hover:bg-ivory disabled:opacity-30" disabled={i === queued.length - 1} onClick={() => void reorder(i, 1)} aria-label="Move later">
                      <ArrowDown className="size-4" />
                    </button>
                    <Link href={`/app/gather?capsule=${capsule.id}&question=${a.questionId}`} className="grid size-8 place-items-center rounded-full text-evergreen hover:bg-ivory" aria-label="Ask now" title="Ask now">
                      <Mic className="size-4" />
                    </Link>
                    <button className="grid size-8 place-items-center rounded-full hover:bg-ivory" onClick={() => void toggleFavorite(a.questionId)} aria-label={isFavorite(a.questionId) ? "Remove from favourites" : "Add to favourites"} aria-pressed={isFavorite(a.questionId)} title="Favourite">
                      <Star className={cn("size-4", isFavorite(a.questionId) && "fill-current text-oxblood")} />
                    </button>
                    <button className="grid size-8 place-items-center rounded-full hover:bg-ivory" onClick={() => void services().capsules.markAssignment(capsule.id, a.questionId, "saved")} aria-label="Save for later" title="Save for later">
                      <Bookmark className="size-4" />
                    </button>
                    <button className="grid size-8 place-items-center rounded-full hover:bg-ivory" onClick={() => void services().capsules.markAssignment(capsule.id, a.questionId, "skipped")} aria-label="Skip for now" title="Skip for now">
                      <SkipForward className="size-4" />
                    </button>
                    <button
                      className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-ivory hover:text-danger"
                      onClick={() => void services().capsules.setAssignments(capsule.id, queued.filter((x) => x.id !== a.id).map((x) => x.questionId))}
                      aria-label="Remove from queue"
                      title="Remove"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {queued.length ? (
              <ButtonLink href={`/app/gather?capsule=${capsule.id}`} leading={<Mic className="size-4" />}>
                Start a session
              </ButtonLink>
            ) : null}
            {queued.length ? (
              <ButtonLink href={`/app/invitations?new=1&capsule=${capsule.id}&questions=${queued.slice(0, 5).map((a) => a.questionId).join(",")}`} variant="secondary" leading={<MailPlus className="size-4" />}>
                Send these by link
              </ButtonLink>
            ) : null}
          </div>
        </Panel>

        {saved.length ? (
          <Panel title="Saved for later" description="Kept aside, not offered in sessions until you move them back.">
            <ul className="space-y-1.5">
              {saved.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] px-2 py-2">
                  <span className="flex min-w-0 flex-1 items-start gap-2.5">
                    <Bookmark className="mt-1 size-4 shrink-0 text-ink-3" />
                    <span className="font-serif text-[1.1rem] leading-snug">{qText(a.questionId)}</span>
                  </span>
                  <Button size="sm" variant="ghost" leading={<ListPlus className="size-3.5" />} onClick={() => void services().capsules.markAssignment(capsule.id, a.questionId, "queued")}>
                    Move to Up next
                  </Button>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        <Panel title="Your favourites" description="Questions you've starred, shared across all your capsules.">
          {favorites.length ? (
            <ul className="space-y-1.5">
              {favorites.map((id) => {
                const inQueue = queued.some((a) => a.questionId === id);
                return (
                  <li key={id} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] px-2 py-2">
                    <span className="flex min-w-0 flex-1 items-start gap-2.5">
                      <button type="button" className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full hover:bg-ivory" onClick={() => void toggleFavorite(id)} aria-label="Remove from favourites" aria-pressed="true">
                        <Star className="size-4 fill-current text-oxblood" />
                      </button>
                      <span className="font-serif text-[1.1rem] leading-snug">{qText(id)}</span>
                    </span>
                    {inQueue ? (
                      <span className="text-[0.8125rem] text-ink-3">In Up next</span>
                    ) : (
                      <Button size="sm" variant="ghost" leading={<ListPlus className="size-3.5" />} onClick={() => void enqueue(id)}>
                        Add to Up next
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[0.9375rem] text-ink-3">Star a question to keep it here.</p>
          )}
        </Panel>

        <Panel title="Answered & skipped">
          {answeredIds.length + skipped.length === 0 ? (
            <p className="text-ink-3">Nothing yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {answeredIds.map((qid) => {
                const answers = answersTo(qid);
                const latest = answers[0]?.id ?? answered.find((a) => a.questionId === qid)?.memoryId;
                return (
                  <li key={qid} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] px-2 py-2">
                    <span className="flex min-w-0 flex-1 items-start gap-2.5">
                      <Check className="mt-1 size-4 shrink-0 text-success" />
                      <span>
                        <span className="block font-serif text-[1.1rem] leading-snug">{qText(qid)}</span>
                        {answers.length > 1 ? <span className="text-[0.8125rem] text-ink-3">{pluralize(answers.length, "answer")}, each one kept</span> : null}
                      </span>
                    </span>
                    <span className="flex gap-1">
                      {latest ? (
                        <Button size="sm" variant="ghost" onClick={() => openMemory(latest)}>
                          {answers.length > 1 ? "Open latest" : "Open answer"}
                        </Button>
                      ) : null}
                      <ButtonLink size="sm" variant="ghost" href={`/app/gather?capsule=${capsule.id}&question=${qid}`} leading={<RotateCcw className="size-3.5" />}>
                        Answer again
                      </ButtonLink>
                    </span>
                  </li>
                );
              })}
              {skipped.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-[12px] px-2 py-2 text-ink-3">
                  <span className="flex items-start gap-2.5">
                    <SkipForward className="mt-1 size-4 shrink-0" />
                    <span className="font-serif text-[1.1rem] leading-snug">{qText(a.questionId)}</span>
                  </span>
                  <Button size="sm" variant="ghost" leading={<Undo2 className="size-3.5" />} onClick={() => void services().capsules.markAssignment(capsule.id, a.questionId, "queued")}>
                    Ask again
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Write your own question">
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await services().capsules.addCustomQuestion(capsule.id, custom, customCat);
              if (r.status === "ok") {
                setCustom("");
                toast.success("Question added to the queue");
              } else toast.error(r.status === "error" ? r.message : "Couldn't add question");
            }}
          >
            <Field label="Question" htmlFor="custom-q" hint="Specific beats general: “What did Dad's workshop smell like?”">
              <Input id="custom-q" value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={240} />
            </Field>
            <Field label="Section" htmlFor="custom-cat">
              <Select id="custom-cat" value={customCat} onChange={(e) => setCustomCat(e.target.value)}>
                {questionCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Button type="submit" leading={<Plus className="size-4" />} disabled={custom.trim().length < 8}>
              Add question
            </Button>
          </form>
        </Panel>

        <Panel title="Question sets" description="Save a set to reuse or send to someone.">
          <ul className="space-y-3">
            {collections.map((c) => (
              <li key={c.id} className="rounded-[14px] border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{c.title}</p>
                  <Badge tone="neutral">{c.questionIds.length}</Badge>
                </div>
                <ul className="mt-2 space-y-1 text-[0.875rem] text-ink-2">
                  {c.questionIds.slice(0, 3).map((id) => (
                    <li key={id} className="truncate">
                      · {qText(id)}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={async () => (await services().capsules.setAssignments(capsule.id, [...queued.map((a) => a.questionId), ...c.questionIds.filter((id) => !queued.some((a) => a.questionId === id))]), toast.success(`Added “${c.title}” to the queue`))}>
                    Add to queue
                  </Button>
                  <ButtonLink size="sm" variant="ghost" href={`/app/invitations?new=1&capsule=${capsule.id}&questions=${c.questionIds.join(",")}`}>
                    Send by link
                  </ButtonLink>
                </div>
              </li>
            ))}
          </ul>
          {queued.length ? (
            <form
              className="mt-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!setName.trim()) return;
                mutate((d) => {
                  d.questionCollections.push({ id: uid("qc"), capsuleId: capsule.id, title: setName.trim(), questionIds: queued.map((a) => a.questionId), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
                });
                setSetName("");
                toast.success("Saved the current queue as a set");
              }}
            >
              <Input value={setName} onChange={(e) => setSetName(e.target.value)} placeholder="Name this set, e.g. “Summers in Maine”" aria-label="New set name" className="h-11" />
              <Button type="submit" variant="secondary" disabled={!setName.trim()}>
                Save
              </Button>
            </form>
          ) : null}
        </Panel>
      </div>

      <QuestionPicker
        open={picker}
        onOpenChange={setPicker}
        selected={queued.map((a) => a.questionId)}
        onConfirm={(ids) => void services().capsules.setAssignments(capsule.id, ids)}
        max={30}
        title="Questions to ask next"
        answeredIds={answeredIds}
      />
    </div>
  );
}
