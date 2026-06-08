"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
  page: number;
  totalPages: number;
}

export function Pagination({ page, totalPages }: PaginationProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  if (totalPages <= 1) return null;

  const createPageUrl = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p === 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  return (
    <nav className="mt-6 flex items-center justify-center gap-2">
      <Link
        href={createPageUrl(page - 1)}
        className={`flex h-8 w-8 items-center justify-center rounded-full border ${
          page <= 1
            ? "pointer-events-none border-neutral-200 text-neutral-400 dark:border-neutral-700 dark:text-neutral-600"
            : "border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
        }`}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      <span className="text-sm text-neutral-600 dark:text-neutral-400">
        Page {page} of {totalPages}
      </span>

      <Link
        href={createPageUrl(page + 1)}
        className={`flex h-8 w-8 items-center justify-center rounded-full border ${
          page >= totalPages
            ? "pointer-events-none border-neutral-200 text-neutral-400 dark:border-neutral-700 dark:text-neutral-600"
            : "border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
        }`}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
