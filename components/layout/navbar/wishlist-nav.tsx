"use client";

import clsx from "clsx";
import { useWishlist } from "components/wishlist/wishlist-context";
import Link from "next/link";

export default function WishlistNav({
  navbarDark,
}: {
  navbarDark?: boolean;
}) {
  const { items } = useWishlist();
  const count = items.length;

  return (
    <Link
      href="/wishlist"
      className={clsx(
        "relative flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-sm font-semibold transition-colors md:px-3 md:py-2",
        navbarDark
          ? "text-white hover:bg-neutral-800"
          : "text-neutral-900 hover:bg-neutral-100"
      )}
      aria-label="Wishlist"
    >
      <svg
        className={clsx("h-5 w-5", navbarDark ? "text-white" : "text-neutral-900")}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
      <span className="hidden sm:inline">Wishlist</span>
    </Link>
  );
}
