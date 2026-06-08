"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { defaultSort } from "lib/storefront/constants";
import type { ListItem } from ".";
import { FilterItem } from "./item";

export default function FilterItemDropdown({ list, defaultPath, placeholder = "Select" }: { list: ListItem[]; defaultPath?: string; placeholder?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultTitle = list.find((item) => "path" in item && item.path === defaultPath)?.title || "";
  const [active, setActive] = useState(defaultTitle || "");
  const [openSelect, setOpenSelect] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const sort = searchParams.get("sort");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpenSelect(false);
      }
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    list.forEach((listItem: ListItem) => {
      if (
        ("path" in listItem && pathname === listItem.path) ||
        ("slug" in listItem &&
          ((sort && sort === listItem.slug) ||
            (!sort && defaultSort.slug === listItem.slug)))
      ) {
        setActive(listItem.title);
      }
    });
  }, [pathname, list, sort]);

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => {
          setOpenSelect(!openSelect);
        }}
        className="flex min-w-[110px] items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-2 py-2 text-sm shadow-sm transition hover:border-neutral-300 sm:min-w-[140px] sm:px-3"
      >
        <div className="truncate text-neutral-900">{active || <span className="text-neutral-400">{placeholder}</span>}</div>
        <ChevronDownIcon className="h-4 flex-none text-neutral-900" />
      </div>
      {openSelect && (
        <div
          onClick={() => {
            setOpenSelect(false);
          }}
          className="absolute z-40 mt-2 w-full rounded-lg border border-neutral-200 bg-white p-2 shadow-lg"
        >
          {list.map((item: ListItem, i) => (
            <FilterItem key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
