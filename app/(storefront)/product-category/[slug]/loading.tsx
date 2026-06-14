import Grid from "components/grid";

export default function Loading() {
  return (
    <>
            <div className="pt-4 md:pt-6">
        <div className="flex items-center gap-2 border-b border-neutral-100 pb-4 sm:gap-3">
          <div className="h-3 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-6 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800 sm:h-8" />
          <div className="ml-auto h-8 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
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
