import { BookOpen, MessageCircleQuestion, ShieldCheck, UserRound, Wallet } from "lucide-react";
import type { InvitationExplainer, InvitationPoint } from "@/domain/invitations";
import { cn } from "@/lib/utils";

const icons: Record<InvitationPoint, React.ReactNode> = {
  from: <UserRound className="mt-0.5 size-5 shrink-0 text-evergreen" aria-hidden />,
  capsule: <BookOpen className="mt-0.5 size-5 shrink-0 text-evergreen" aria-hidden />,
  ask: <MessageCircleQuestion className="mt-0.5 size-5 shrink-0 text-evergreen" aria-hidden />,
  payment: <Wallet className="mt-0.5 size-5 shrink-0 text-evergreen" aria-hidden />,
  use: <ShieldCheck className="mt-0.5 size-5 shrink-0 text-evergreen" aria-hidden />,
};

/** The five answers every invitation gives, in large, plain type. */
export function InvitationPoints({ points, size = "lg", className }: { points: InvitationExplainer[]; size?: "lg" | "sm"; className?: string }) {
  return (
    <dl className={cn(size === "lg" ? "space-y-6 text-[1.1rem] leading-snug" : "space-y-4 text-[0.9375rem] leading-snug", className)}>
      {points.map((p) => (
        <div key={p.key}>
          <dt className="flex gap-3 font-medium">
            {icons[p.key]}
            {p.title}
          </dt>
          <dd className="mt-1 pl-8 text-ink-2">
            {p.body}
            {p.questions?.length ? (
              <ol className={cn("mt-3 space-y-1.5 border-l-2 border-evergreen/30 pl-4 font-serif italic text-ink", size === "lg" ? "text-[1.15rem]" : "text-[1rem]")}>
                {p.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ol>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
