"use client";

import Grid from "components/grid";
import { GridTileImage } from "components/grid/tile";
import { Product } from "lib/sfcc/types";
import Link from "next/link";

import Image from "next/image";

interface CategoryData {
  slug: string;
  name: string;
  description?: string;
  image?: string;
  emoji?: string;
  children?: { slug: string; title: string; path: string }[];
}

interface CategorySectionsProps {
  categories: CategoryData[];
  initialData: Record<string, { products: Product[]; total: number; page: number; totalPages: number }>;
}

const headerThemes = [
  "bg-[#C3173C]",
  "bg-[#155EEF]",
  "bg-[#E25A00]",
  "bg-[#0F766E]",
  "bg-[#7C3AED]",
  "bg-[#1D4ED8]",
];

export default function CategorySections({ categories, initialData }: CategorySectionsProps) {
  const data = initialData;

  return (
    <div className="w-full py-4 md:py-8" style={{ backgroundColor: "#E1F3FF" }}>
      <div className="mx-auto max-w-7xl space-y-6 px-3 md:space-y-10 md:px-4 lg:px-6">
        {categories.map((cat, sectionIndex) => {
          const catData = data[cat.slug];
          if (!catData || catData.products.length === 0) return null;

          return (
            <section key={cat.slug} className="overflow-hidden rounded-xl bg-[#FAFAFA] shadow-sm ring-1 ring-neutral-200">
              <div className={`flex items-center justify-between gap-3 px-3 py-2 text-white md:gap-4 md:px-5 md:py-2.5 ${headerThemes[sectionIndex % headerThemes.length]}`}>
                <div className="flex min-w-0 items-center gap-1.5 md:gap-3">
                  {cat.emoji ? (
                    <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-white text-lg">
                      <span className="text-lg leading-none">{cat.emoji}</span>
                    </div>
                  ) : cat.image ? (
                    // Only image is available: show a small favicon fallback in the header (first column)
                    <div className="flex-shrink-0">
                      <Image src="/favicon.ico" alt={cat.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                    </div>
                  ) : null}
                  <div className="relative group">
                    <h2 className="truncate text-base font-bold md:text-2xl flex items-center gap-2">
                      {cat.name}
                      {cat.children && cat.children.length > 0 && (
                        <span className="hidden md:inline-flex items-center justify-center rounded-sm bg-white/20 px-1 py-0.5 text-xs font-medium">{cat.children.length} ▸</span>
                      )}
                    </h2>

                    {/* Popover showing children on hover (desktop) */}
                    {cat.children && cat.children.length > 0 && (
                      <div className="hidden md:block absolute left-0 top-full z-40 mt-2 min-w-[200px] rounded-md bg-white text-neutral-900 shadow-lg group-hover:block">
                        <div className="flex flex-col">
                          {cat.children.map((child) => (
                            <Link key={child.slug} href={child.path} className="px-3 py-2 text-sm hover:bg-neutral-100">
                              {child.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                  {cat.description ? (
                    <p className="hidden truncate text-xs font-medium text-white/85 sm:block md:text-sm">
                      {cat.description}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/product-category/${cat.slug}`}
                  className="shrink-0 text-xs font-bold text-white transition-opacity hover:opacity-85 md:text-sm"
                >
                  See All
                </Link>
              </div>

              <div className="p-3 md:p-5">
                <Grid className="grid-cols-2 gap-2 lg:grid-cols-6 lg:gap-3">
                  {catData.products.map((product, index) => (
                    <Grid.Item
                      key={product.handle}
                      className={`animate-fadeIn ${index >= 4 ? "hidden lg:block" : ""}`}
                    >
                      <Link
                        className="group relative inline-block h-full w-full"
                        href={`/product/${product.handle}`}
                        prefetch={true}
                      >
                        <div className="relative h-full overflow-hidden rounded-xl bg-neutral-100">
                          <GridTileImage
                            alt={product.title}
                            label={{
                              title: product.title,
                              amountMin: product.priceRange.minVariantPrice.amount,
                              amountMax: product.priceRange.maxVariantPrice.amount,
                              currencyCode: product.currencyCode,
                            }}
                            src={product.featuredImage?.url}
                            fill
                            sizes="(min-width: 1024px) 16vw, (min-width: 640px) 50vw, 100vw"
                            priority={index < 2}
                          />
                          <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/10" />
                        </div>
                      </Link>
                    </Grid.Item>
                  ))}
                </Grid>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}


