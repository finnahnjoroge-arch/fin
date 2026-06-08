"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function BrandCollections({ collections }: { collections: { title: string; handle: string }[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const [active, setActive] = useState("");
  const [openSelect, setOpenSelect] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
    if (!category) {
      setActive("All");
      return;
    }
    const matched = collections.find((c) => c.handle === category);
    setActive(matched ? matched.title : "All");
  }, [category, collections]);

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setOpenSelect(!openSelect)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:border-neutral-300"
      >
        <div className="truncate text-neutral-900">{active}</div>
        <ChevronDownIcon className="h-4 flex-none text-neutral-900" />
      </div>
      {openSelect && (
        <div
          onClick={() => setOpenSelect(false)}
          className="absolute z-40 mt-2 w-full rounded-lg border border-neutral-200 bg-white p-2 shadow-lg"
        >
          <Link
            href={pathname}
            className={`block w-full rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 hover:underline hover:underline-offset-4 dark:hover:bg-neutral-900 ${!category ? "underline underline-offset-4" : ""}`}
          >
            All
          </Link>
          {collections.map((item) => {
            const isActive = category === item.handle;
            const params = new URLSearchParams(searchParams.toString());
            params.set("category", item.handle);
            const href = `${pathname}?${params.toString()}`;
            return (
              <Link
                key={item.handle}
                href={href}
                className={`block w-full rounded-md px-2 py-1.5 text-sm hover:bg-neutral-100 hover:underline hover:underline-offset-4 dark:hover:bg-neutral-900 ${isActive ? "underline underline-offset-4" : ""}`}
              >
                {item.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
