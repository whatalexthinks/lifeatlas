import { Check, Minus } from "lucide-react";
import { everydayRoles, roleLabels, roleSummary } from "@/domain/policies/permissions";
import { cn } from "@/lib/utils";

const yes = <Check className="size-4 text-evergreen" aria-label="Yes" />;
const no = <Minus className="size-4 text-ink-4" aria-label="No" />;

/** Who can do what in a capsule, rendered from the same rules the app uses. */
export function RolesTable({ className }: { className?: string }) {
  const cols: { key: string; label: string; cell: (r: ReturnType<typeof roleSummary>) => React.ReactNode }[] = [
    { key: "read", label: "Read", cell: (r) => (r.read === "everything" ? "Everything" : r.read === "all_but_private" ? "All but others' “Only me” stories" : r.read === "shared" ? "What's shared with them" : no) },
    { key: "add", label: "Add stories", cell: (r) => (r.add ? yes : no) },
    { key: "edit", label: "Edit", cell: (r) => (r.edit === "all" ? "Any story" : r.edit === "own" ? "Their own" : no) },
    { key: "invite", label: "Invite", cell: (r) => (r.invite ? yes : no) },
    { key: "export", label: "Download", cell: (r) => (r.export ? yes : no) },
    { key: "delete", label: "Delete", cell: (r) => (r.delete === "capsule" ? "Any story, and the capsule" : r.delete === "all" ? "Any story" : r.delete === "own" ? "Their own" : no) },
  ];
  return (
    <div className={cn("overflow-x-auto rounded-[20px] border border-line bg-surface", className)} tabIndex={0} role="region" aria-label="Roles and permissions (scrolls sideways on small screens)">
      <table className="w-full min-w-[720px] border-collapse text-left text-[0.9375rem]">
        <caption className="sr-only">What each role can do in a capsule</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="p-4 font-medium text-ink-3">
              Role
            </th>
            {cols.map((c) => (
              <th key={c.key} scope="col" className="p-4 font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {everydayRoles.map((role) => {
            const r = roleSummary(role);
            return (
              <tr key={role} className="border-b border-line align-top last:border-0">
                <th scope="row" className="p-4 font-normal">
                  <span className="block font-medium">{roleLabels[role].label}</span>
                  <span className="mt-0.5 block max-w-[15rem] text-[0.8125rem] leading-snug text-ink-3">{role === "owner" ? "Chooses the plan. Everyone else joins free." : roleLabels[role].description}</span>
                </th>
                {cols.map((c) => (
                  <td key={c.key} className="p-4 text-ink-2">
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
