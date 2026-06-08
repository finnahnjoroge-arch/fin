import Grid from "components/grid";

export default function Loading() {
  return (
    <>
      <div className="mb-6 flex items-center gap-1 border-b border-neutral-200 py-3 sm:gap-3 dark:border-neutral-700">
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="ml-auto h-8 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
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
