export type SortFilterItem = {
  title: string;
  slug: string | null;
  sortKey:
    | "best-matches"
    | "price-low-to-high"
    | "price-high-to-low"
    | "newest";
  reverse: boolean;
};

export const defaultSort: SortFilterItem = {
  title: "Best Matches",
  slug: "best-matches",
  sortKey: "best-matches",
  reverse: false,
};

export const sorting: SortFilterItem[] = [
  defaultSort,
  {
    title: "Price Low to High",
    slug: "price-low-to-high",
    sortKey: "price-low-to-high",
    reverse: false,
  },
  {
    title: "Price High to Low",
    slug: "price-high-to-low",
    sortKey: "price-high-to-low",
    reverse: false,
  },
  {
    title: "Newest",
    slug: "newest",
    sortKey: "newest",
    reverse: false,
  },
];
