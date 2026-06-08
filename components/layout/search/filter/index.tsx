import clsx from "clsx";
import { SortFilterItem } from "lib/storefront/constants";
import { Suspense } from "react";
import FilterItemDropdown from "./dropdown";
import { FilterItem } from "./item";

export type ListItem = SortFilterItem | PathFilterItem;
export type PathFilterItem = { title: string; path: string };

function FilterItemList({ list }: { list: ListItem[] }) {
  return (
    <>
      {list.map((item: ListItem, i) => (
        <FilterItem key={i} item={item} />
      ))}
    </>
  );
}

export default function FilterList({
  list,
  title,
  horizontal,
  defaultPath,
  placeholder,
}: {
  list: ListItem[];
  title?: string;
  horizontal?: boolean;
  defaultPath?: string;
  placeholder?: string;
}) {
  if (horizontal) {
    return (
      <nav className="flex items-center gap-2">
        {title ? (
          <span className="hidden whitespace-nowrap text-xs font-medium text-neutral-500 sm:block dark:text-neutral-400">
            {title}
          </span>
        ) : null}
        <Suspense fallback={null}>
          <FilterItemDropdown list={list} defaultPath={defaultPath} placeholder={placeholder ?? title} />
        </Suspense>
      </nav>
    );
  }

  return (
    <>
      <nav>
        {title ? (
          <h3 className={clsx("text-xs text-neutral-500 dark:text-neutral-400", horizontal ? "mb-1" : "hidden md:block")}>
            {title}
          </h3>
        ) : null}
        <ul className={clsx(horizontal ? "flex flex-wrap gap-3" : "hidden md:block")}>
          <Suspense fallback={null}>
            <FilterItemList list={list} />
          </Suspense>
        </ul>
        {!horizontal && (
          <ul className="md:hidden">
            <Suspense fallback={null}>
              <FilterItemDropdown list={list} />
            </Suspense>
          </ul>
        )}
      </nav>
    </>
  );
}
