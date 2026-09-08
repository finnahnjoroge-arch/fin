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
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    );
  }
  return (
    <span className="inline-flex h-full w-full items-center justify-center text-3xl sm:text-4xl md:text-5xl">
      <CategoryIcon value={category.emoji} fallback={"\u{1F4E6}"} iconClassName="text-current" />
    </span>
  );
}

function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group flex shrink-0 snap-start flex-col items-center gap-2 px-2 text-center md:min-w-[168px] lg:min-w-[174px]"
      style={{ minWidth: "25%" }}
    >
      {/* Circle */}
      <div className="relative h-[96px] w-[96px] overflow-hidden rounded-full bg-white shadow-md ring-2 ring-white transition-all duration-300 group-hover:shadow-lg group-hover:ring-4 group-hover:ring-blue-200 sm:h-[108px] sm:w-[108px] md:h-[160px] md:w-[160px] lg:h-[172px] lg:w-[172px]">
        <CategoryArtwork category={category} />
      </div>
      {/* Label */}
      <span className="line-clamp-2 text-center text-[11px] font-bold leading-tight text-neutral-800 group-hover:text-blue-600 sm:text-xs md:text-[14px] lg:text-[15px]">
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
    <section className="relative w-full overflow-hidden bg-[#DDF3FF] pb-6 pt-0 md:pb-8 md:pt-1">
      {/* White wave at bottom */}
      <div
        className="absolute inset-x-[-18%] bottom-0 h-[56%] rounded-t-[55%] bg-[#FAFAFA] md:inset-x-[-10%] md:h-[52%]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-1.5 md:px-3 lg:px-4">
        <div className="relative flex items-center overflow-visible">
          {/* Left button */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="absolute left-0 top-[3.4rem] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md ring-1 ring-black/5 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 md:top-[6.2rem] lg:flex"
            aria-label="Scroll categories left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Scroll track */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="scrollbar-hide flex w-full gap-0 overflow-x-auto overflow-y-visible px-0 pb-0 pt-1 sm:gap-1 md:gap-2 md:px-1 md:pt-2 lg:px-10"
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
            className="absolute right-0 top-[3.4rem] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md ring-1 ring-black/5 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 md:top-[6.2rem] lg:flex"
            aria-label="Scroll categories right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}