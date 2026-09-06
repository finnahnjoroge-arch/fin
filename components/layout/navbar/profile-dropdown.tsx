"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function ProfileDropdown({
  navbarDark,
}: {
  navbarDark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dark = navbarDark;

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Link
        href="/account"
        aria-label="My Account"
        className={clsx(
          "flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-sm font-semibold transition-colors md:px-3 md:py-2",
          dark
            ? "text-white hover:bg-neutral-800"
            : "text-neutral-900 hover:bg-neutral-100",
        )}
      >
        <svg
          className={clsx("h-5 w-5", dark ? "text-white" : "text-neutral-900")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span className="hidden sm:inline">Account</span>
      </Link>
    </div>
  );
}
