"use client";

import clsx from "clsx";
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

const circleThemes = [
  "bg-[#F35A22]",
  "bg-[#F7B500]",
  "bg-[#F08A00]",
  "bg-[#F7B500]",
  "bg-[#0B1D8A]",
  "bg-[#FF4A2F]",
];

function CategoryArtwork({ category, preferImage = true }: { category: Category; preferImage?: boolean }) {
  // preferImage: when true (carousel), use image if available; when false (header), prefer emoji and fallback to favicon if only image exists
  if (preferImage) {
    if (category.image) {
      return (
        <Image
          src={category.image}
          alt={category.title}
          width={220}
          height={220}
          className="h-full w-full object-cover"
        />
      );
    }

    return (
      <span
        className="text-4xl leading-none sm:text-5xl md:text-7xl"
        style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.18))" }}
      >
        {category.emoji || "\u{1F4E6}"}
      </span>
    );
  }

  // prefer emoji; if not available and image exists, show the image; otherwise fallback to box emoji
  if (category.emoji) {
    return (
      <span className="text-4xl leading-none sm:text-5xl md:text-7xl" style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.18))" }}>
        {category.emoji}
      </span>
    );
  }

  if (category.image) {
    return (
      <Image
        src={category.image}
        alt={category.title}
        width={220}
        height={220}
        className="h-full w-full object-cover"
      />
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
      className="group flex min-w-[25%] shrink-0 snap-start flex-col items-center text-center px-1 md:min-w-[168px] md:px-0 lg:min-w-[172px]"
    >
      <div
        className={clsx(
          "flex h-[76px] w-[76px] items-center justify-center rounded-full transition-transform duration-300 group-hover:-translate-y-1 sm:h-[84px] sm:w-[84px] md:h-[158px] md:w-[158px] lg:h-[164px] lg:w-[164px] overflow-hidden bg-[#FAFAFA] ring-1 ring-neutral-300 md:ring-2 md:ring-neutral-300"
        )}
      >
        <CategoryArtwork category={category} preferImage={true} />
      </div>
      <span className="mt-2 line-clamp-2 min-h-[1.9rem] px-1 text-center text-[11px] font-semibold leading-tight text-neutral-950 sm:text-xs md:mt-3 md:min-h-[2.4rem] md:px-2 md:text-[15px] md:font-bold">
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
    <section className="w-full bg-[#FAFAFA] pb-1 pt-3 md:pb-2 md:pt-5 lg:pb-2 lg:pt-5">
      <div className="mx-auto max-w-7xl px-1.5 md:px-3 lg:px-4">
        <div className="relative flex items-center">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="absolute left-0 top-[2.75rem] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
            aria-label="Scroll categories left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="scrollbar-hide flex w-full gap-0 overflow-x-auto px-0 pb-0 pt-0 sm:gap-1 md:gap-2 md:px-1 lg:px-10"
            style={{ scrollBehavior: "smooth", scrollSnapType: "x mandatory" }}
          >
            {visibleCategories.map((category, index) => (
              <CategoryTile key={category.slug} category={category} index={index} />
            ))}
          </div>

          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="absolute right-0 top-[2.75rem] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 lg:flex"
            aria-label="Scroll categories right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

