import { Check, Minus } from "lucide-react";
import type { Role } from "@/domain/models";
import { accessMatrix, can, roleLabels } from "@/domain/policies/permissions";

const matrixRoles: Role[] = ["owner", "organizer", "storyteller", "contributor", "viewer", "successor"];

/**
 * What each role can do, grouped as people think about it, reading, editing, inviting,
 * exporting, deleting. Rendered from the same rules the app enforces, so it can't disagree.
 */
export function AccessMatrix() {
  return (
    <>
      <div className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-evergreen" tabIndex={0} role="region" aria-label="What each role can do (scrolls sideways on small screens)">
        <table className="w-full min-w-[760px] text-[0.875rem]">
          <caption className="sr-only">What each role can do in a capsule</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="px-6 py-3 text-left font-normal text-ink-3">
                <span className="sr-only">Permission</span>
              </th>
              {matrixRoles.map((r) => (
                <th key={r} scope="col" className="px-2 py-3 text-center font-medium">
                  {roleLabels[r].label}
                </th>
              ))}
            </tr>
          </thead>
          {accessMatrix.map((g) => (
            <tbody key={g.group} className="border-b border-line last:border-0">
              <tr>
                <th scope="colgroup" colSpan={matrixRoles.length + 1} className="bg-paper/60 px-6 pt-4 pb-2 text-left font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink-3">
                  {g.group}
                </th>
              </tr>
              {g.rows.map((row) => (
                <tr key={row.capability} className="border-t border-line/60">
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
          ))}
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
      <p className="border-t border-line px-6 py-4 text-[0.8125rem] text-ink-3">Everyone except the owner joins free. Successors have no access now, a later release adds a verified handover, never an automatic one. In this preview, permissions are simulated on this device.</p>
    </>
  );
}
