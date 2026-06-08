import Grid from "components/grid";

export default function Loading() {
  return (
    <>
      <div className="mb-3 flex min-w-0 items-end gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-700 sm:mb-6 sm:items-center sm:gap-3 sm:pb-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
          <div className="h-3 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-6 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800 sm:h-8" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <Grid className="grid-cols-2 lg:grid-cols-6">
        {Array(12)
          .fill(0)
          .map((_, index) => {
            return (
              <Grid.Item
                key={index}
                className="animate-pulse bg-neutral-100 dark:bg-neutral-800"
              />
            );
          })}
      </Grid>
    </>
  );
}
