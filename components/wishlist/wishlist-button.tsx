"use client";

import { useWishlist } from "components/wishlist/wishlist-context";

export function WishlistButton({
  handle,
  className = "",
  size = "md",
}: {
  handle: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { has, toggle } = useWishlist();
  const isSaved = has(handle);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <button
      type="button"
      onClick={() => toggle(handle)}
      aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
      className={`group flex ${sizeClasses[size]} shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
        isSaved
          ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-300"
          : "border-neutral-200 bg-white text-neutral-400 hover:border-red-200 hover:text-red-400 hover:bg-red-50"
      } ${className}`}
    >
      <svg
        className={`${iconSizes[size]} transition-transform duration-200 group-hover:scale-110`}
        viewBox="0 0 24 24"
        fill={isSaved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={isSaved ? 0 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
