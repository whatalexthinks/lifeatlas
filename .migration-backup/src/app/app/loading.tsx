import { Skeleton } from "@/components/ui/feedback";

/** Shown inside the studio shell while a page loads, so the navigation never disappears. */
export default function StudioLoading() {
  return (
    <div className="mx-auto max-w-[1240px]" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-5 h-12 w-2/3 max-w-xl" />
      <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
