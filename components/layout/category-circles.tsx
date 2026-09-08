"use client";

import { CategoryIcon } from "components/category-icon";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

interface Category {
  slug: string;
  title: string;
  emoji?: string;
  image?: string;
}

function CategoryArtwork({ category }: { category: Category }) {
  if (category.image) {
    return (
      <Image
        src={category.image}
        alt={category.title}
        width={200}
        height={200}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <span className="inline-flex h-full w-full items-center justify-center text-4xl sm:text-5xl">
      <CategoryIcon value={category.emoji} fallback={"\u{1F4E6}"} iconClassName="text-current" />
    </span>
  );
}

function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group flex shrink-0 snap-start flex-col items-center gap-3 px-1 text-center"
      style={{ minWidth: "clamp(120px, 20vw, 160px)" }}
    >
      {/* Circle */}
      <div
        className="relative overflow-hidden rounded-full bg-white border border-neutral-200 shadow-sm transition-opacity duration-200 group-hover:opacity-90"
        style={{ width: "clamp(110px, 18vw, 150px)", height: "clamp(110px, 18vw, 150px)" }}
      >
        <CategoryArtwork category={category} />
      </div>
      {/* Label */}
      <span
        className="line-clamp-2 text-center font-semibold leading-snug text-neutral-800 group-hover:text-neutral-600"
        style={{ fontSize: "clamp(11px, 2.8vw, 14px)" }}
      >
        {category.title}
      </span>
    </Link>
  );
}

export function CategoryCircles({ categories }: { categories: Category[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const visibleCategories = useMemo(() => categories, [categories]);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [visibleCategories.length]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -Math.round(el.clientWidth * 0.85) : Math.round(el.clientWidth * 0.85),
      behavior: "smooth",
    });
    window.setTimeout(checkScroll, 320);
  };

  if (!visibleCategories.length) return null;

  return (
    <section className="relative w-full bg-[#F5F5F5] py-4 md:py-5 border-y border-neutral-200">
      <div className="relative mx-auto max-w-7xl">
        <div className="relative flex items-center">
          {/* Left button */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="absolute left-0 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-500 shadow ring-1 ring-black/10 transition hover:text-neutral-800 disabled:cursor-not-allowed disabled:opacity-20 lg:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Scroll track */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="scrollbar-hide flex w-full items-start gap-0 overflow-x-auto px-1 py-2 md:px-2 lg:px-8"
            style={{ scrollBehavior: "smooth", scrollSnapType: "x mandatory" }}
          >
            {visibleCategories.map((category) => (
              <CategoryTile key={category.slug} category={category} />
            ))}
          </div>

          {/* Right button */}
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="absolute right-0 top-1/2 z-20 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-500 shadow ring-1 ring-black/10 transition hover:text-neutral-800 disabled:cursor-not-allowed disabled:opacity-20 lg:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}