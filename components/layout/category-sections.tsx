








"use client";

import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { useCart } from "components/cart/cart-context";
import { CategoryIcon } from "components/category-icon";
import Grid from "components/grid";
import { GridTileImage } from "components/grid/tile";
import { Product } from "lib/sfcc/types";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  const { addCartItem } = useCart();
  const [whatsappPhone, setWhatsappPhone] = useState("");

  useEffect(() => {
    fetch("/api/storefront/settings")
      .then((r) => r.json())
      .then((s) => setWhatsappPhone(s.whatsappPhone || ""))
      .catch(() => {});
  }, []);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const variant = product.variants?.[0];
    if (variant) addCartItem(variant, product);
  };

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
                      <CategoryIcon value={cat.emoji} iconClassName="text-lg leading-none text-neutral-900" />
                    </div>
                  ) : cat.image ? (
                    // Only image is available: show a small favicon fallback in the header (first column)
                    <div className="flex-shrink-0">
                      <Image src="/favicon.ico" alt={cat.name} width={40} height={40} loading="lazy" className="h-10 w-10 rounded-full object-cover" />
                    </div>
                  ) : null}
                  <div className="relative group">
                    <h2 className="truncate text-base font-bold md:text-2xl flex items-center gap-2">
                      {cat.name}
                      {cat.children && cat.children.length > 0 && (
                        <span className="hidden md:inline-flex items-center justify-center rounded-sm bg-white/20 px-1 py-0.5 text-xs font-medium">{cat.children.length} Γû╕</span>
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
                                    {catData.products.map((product, index) => {
                    const firstVariant = product.variants?.[0];
                    const available = product.availableForSale && !!firstVariant;
                    const cleanPhone = whatsappPhone?.replace(/\D/g, "") || "";
                    const productUrl = typeof window !== "undefined"
                      ? `${window.location.origin}/product/${product.handle}`
                      : "";

                                        const actionButtons = (
                      <>
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={!available}
                          className="flex flex-1 items-center justify-center gap-1 bg-[#2563EB] px-2 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60 sm:gap-1.5 sm:px-3 sm:text-xs"
                        >
                                                    <span className="text-sm leading-none font-bold">+</span>
                          <ShoppingCartIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          {available ? "Cart" : "Sold"}
                        </button>
                        {cleanPhone && (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      e.stopPropagation();
                                                      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent("Hi, I want to buy:\n\n*" + product.title + "*\n*Url:* " + productUrl + "\n\nThank you.")}`;
                                                      window.open(url, "_blank", "noopener,noreferrer");
                                                    }}
                                                    className="flex flex-1 items-center justify-center gap-1 bg-[#22C55E] px-2 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#16A34A] sm:gap-1.5 sm:px-3 sm:text-xs"
                                                  >
                                                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="currentColor">
                                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.284A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                    </svg>
                                                    Chat
                                                  </button>
                                                )}
                      </>
                    );

                    return (
                    <Grid.Item
                      key={product.handle}
                      className={`animate-fadeIn ${index >= 4 ? "hidden lg:block" : ""}`}
                    >
                      <Link
                        href={`/product/${product.handle}`}
                        prefetch={true}
                        className="block h-full"
                      >
                        <GridTileImage
                          alt={product.title}
                          label={{
                            title: product.title,
                            amountMin: product.priceRange.minVariantPrice.amount,
                            amountMax: product.priceRange.maxVariantPrice.amount,
                            currencyCode: product.currencyCode,
                          }}
                                                    labelActions={actionButtons}
                          comparePrice={product.comparePrice?.amount}
                          src={product.featuredImage?.url}
                          fill
                          loading="lazy"
                                                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 50vw, 100vw"
                        />
                      </Link>
                    </Grid.Item>
                    );
                  })}
                </Grid>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}


