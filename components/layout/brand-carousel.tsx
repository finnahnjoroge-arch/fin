"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

export function BrandCarousel({ brands }: { brands: any[] }) {
  if (!brands?.length) return null;

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full py-3 md:py-5" style={{ backgroundColor: "#E1F3FF" }}>
      <div className="mx-auto max-w-7xl px-3 md:px-4 lg:px-6">
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 bg-gradient-to-r from-white via-[#F8FBFF] to-[#EEF6FF] px-3 py-2.5 md:px-5 md:py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700 md:text-[11px]">
                  Trusted Brands
                </span>
                <h2 className="mt-1.5 text-lg font-bold text-neutral-900 md:text-xl">Shop by Brands</h2>
                <p className="mt-0.5 text-xs text-neutral-600 md:text-sm">Explore our trusted brand partners</p>
              </div>
              <div className="hidden rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 md:block">
                Official collections
              </div>
            </div>
          </div>

          <div className="relative bg-gradient-to-b from-[#FBFDFF] to-white px-2.5 py-3 md:px-5 md:py-4">
            <button
              onClick={() => scroll("left")}
              className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white p-2 text-neutral-700 shadow-md transition-all hover:shadow-lg md:flex"
              aria-label="Scroll brands left"
              type="button"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white p-2 text-neutral-700 shadow-md transition-all hover:shadow-lg md:flex"
              aria-label="Scroll brands right"
              type="button"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div
              ref={scrollRef}
              className="scrollbar-hide flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-0 pb-0.5 pt-0 md:gap-3 md:px-9 md:snap-none"
            >
              {brands.map((brand) => (
                <Link
                  key={brand._id}
                  href={`/brand/${brand.slug}`}
                  className="group flex h-[102px] w-[128px] flex-none snap-start flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md md:h-[118px] md:w-[152px]"
                >
                  <div className="relative flex flex-1 items-center justify-center bg-gradient-to-b from-white to-neutral-50 p-3 md:p-4">
                    {brand.imageUrl ? (
                      <Image
                        src={brand.imageUrl}
                        alt={brand.name}
                        fill={false}
                        width={120}
                        height={60}
                        className="max-h-full w-auto max-w-full object-contain"
                        sizes="152px"
                        unoptimized
                      />
                    ) : (
                      <span className="line-clamp-2 text-center text-xs font-semibold text-neutral-700 md:text-sm">
                        {brand.name}
                      </span>
                    )}
                  </div>
                  <div className="border-t border-neutral-100 bg-white px-2.5 py-1.5 text-center">
                    <span className="line-clamp-1 text-[11px] font-semibold text-neutral-800 md:text-xs">
                      {brand.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
