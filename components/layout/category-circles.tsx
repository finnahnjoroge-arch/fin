"use client";

import clsx from "clsx";
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

function CategoryArtwork({ category, preferImage = true }: { category: Category; preferImage?: boolean }) {
  // preferImage: when true (carousel), use image if available; when false (header), prefer emoji and fallback to favicon if only image exists
  if (preferImage) {
    if (category.image) {
      return (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full">
          <Image
            src={category.image}
            alt={category.title}
            width={220}
            height={220}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      );
    }

    return (
      <span
        className="inline-flex h-full w-full items-center justify-center text-4xl leading-none drop-shadow-[0_16px_18px_rgba(15,23,42,0.22)] sm:text-5xl md:text-7xl"
        style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.18))" }}
      >
        <CategoryIcon value={category.emoji} fallback={"\u{1F4E6}"} iconClassName="text-current" />
      </span>
    );
  }

  // prefer emoji; if not available and image exists, show the image; otherwise fallback to box emoji
  if (category.emoji) {
    return (
      <span className="inline-flex h-[2.5rem] w-[2.5rem] items-center justify-center text-4xl leading-none sm:h-[3rem] sm:w-[3rem] sm:text-5xl md:h-[4.5rem] md:w-[4.5rem] md:text-7xl" style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.18))" }}>
        <CategoryIcon value={category.emoji} iconClassName="text-current" />
      </span>
    );
  }

    if (category.image) {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full">
        <Image
          src={category.image}
          alt={category.title}
          width={220}
          height={220}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <span className="text-4xl leading-none sm:text-5xl md:text-7xl">{"\u{1F4E6}"}</span>
  );
}

function CategoryTile({ category, index }: { category: Category; index: number }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group relative z-10 flex min-w-[25%] shrink-0 snap-start flex-col items-center px-1 text-center md:min-w-[168px] md:px-0 lg:min-w-[174px]"
    >
      <div className="relative flex h-[96px] w-[96px] items-center justify-center sm:h-[108px] sm:w-[108px] md:h-[176px] md:w-[176px] lg:h-[184px] lg:w-[184px]">
        <div
          className={clsx(
            "absolute inset-[7px] rounded-full bg-[#FAFAFA] shadow-[inset_0_0_0_2px_rgba(17,24,39,0.16),0_8px_18px_rgba(15,23,42,0.08)] transition-transform duration-300 group-hover:scale-[1.03] md:inset-[9px] md:shadow-[inset_0_0_0_3px_rgba(17,24,39,0.16),0_12px_26px_rgba(15,23,42,0.10)]"
          )}
        />
        <div className="relative z-10 flex h-[76%] w-[76%] items-center justify-center overflow-hidden rounded-full transition-transform duration-300 group-hover:-translate-y-1 md:h-[82%] md:w-[82%]">
          <CategoryArtwork category={category} preferImage={true} />
        </div>
      </div>
      <span className="-mt-0.5 line-clamp-2 min-h-[1.9rem] px-1 text-center text-[11px] font-bold leading-tight text-neutral-950 sm:text-xs md:mt-0 md:min-h-[2.4rem] md:px-2 md:text-[15px]">
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
    const element = scrollContainerRef.current;
    if (!element) return;
    const { scrollLeft, scrollWidth, clientWidth } = element;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [visibleCategories.length]);

  const scroll = (direction: "left" | "right") => {
    const element = scrollContainerRef.current;
    if (!element) return;
    const scrollAmount = Math.max(220, Math.round(element.clientWidth * 0.9));
    element.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
    window.setTimeout(checkScroll, 320);
  };

  if (!visibleCategories.length) return null;

  return (
    <section className="relative w-full overflow-hidden bg-[#DDF3FF] pb-6 pt-0 md:pb-8 md:pt-1">
      <div
        className="absolute inset-x-[-18%] bottom-0 h-[56%] rounded-t-[55%] bg-[#FAFAFA] md:inset-x-[-10%] md:h-[52%]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-1.5 md:px-3 lg:px-4">
        <div className="relative flex items-center overflow-visible">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="absolute left-0 top-[3.4rem] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md ring-1 ring-black/5 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 md:top-[6.2rem] lg:flex"
            aria-label="Scroll categories left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="scrollbar-hide flex w-full gap-0 overflow-x-auto overflow-y-visible px-0 pb-0 pt-1 sm:gap-1 md:justify-center md:gap-2 md:px-1 md:pt-2 lg:px-10"
            style={{ scrollBehavior: "smooth", scrollSnapType: "x mandatory" }}
          >
            {visibleCategories.map((category, index) => (
              <CategoryTile key={category.slug} category={category} index={index} />
            ))}
          </div>

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

