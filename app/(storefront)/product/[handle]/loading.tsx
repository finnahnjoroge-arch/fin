export default function Loading() {
  return (




    <div className="mx-auto w-full max-w-none px-0 pb-24 md:px-4 md:pb-6 lg:max-w-(--breakpoint-5xl)">
      {/* Mobile skeleton */}
      <div className="lg:hidden">
        <div className="bg-white px-2 pt-0.5">
          <div className="relative aspect-[4/3] max-h-[44vh] w-full animate-pulse overflow-hidden rounded-2xl bg-neutral-100" />
        </div>










        <div className="bg-white px-3 pt-2 pb-3">
          <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-neutral-100" />
          <div className="mb-3 h-5 w-32 animate-pulse rounded bg-neutral-100" />
          <div className="mb-2 h-9 w-full animate-pulse rounded-full bg-neutral-100" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-neutral-100" />
        </div>
      </div>

      {/* Desktop skeleton */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)_minmax(260px,0.72fr)] lg:items-start">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="relative aspect-square max-h-[400px] w-full animate-pulse rounded-xl bg-neutral-100" />
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-3 h-8 w-3/4 animate-pulse rounded bg-neutral-100" />
          <div className="mb-6 h-6 w-32 animate-pulse rounded bg-neutral-100" />
          <div className="mb-3 h-4 w-full animate-pulse rounded bg-neutral-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-100" />
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-3 h-12 w-full animate-pulse rounded-lg bg-neutral-100" />
          <div className="h-12 w-full animate-pulse rounded-lg bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}
