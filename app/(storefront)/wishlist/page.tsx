"use client";

import { Button } from "@/components/ui/button";
import Price from "components/price";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useWishlist } from "components/wishlist/wishlist-context";

interface WishlistProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  featuredImage?: { url: string; altText: string };
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
    maxVariantPrice: { amount: string; currencyCode: string };
  };
  currencyCode: string;
  comparePrice?: { amount: string; currencyCode: string };
  availableForSale: boolean;
}

function WishlistCard({
  product,
  onRemove,
}: {
  product: WishlistProduct;
  onRemove: () => void;
}) {
  const minPrice = parseFloat(product.priceRange.minVariantPrice.amount);
  const compare = product.comparePrice
    ? parseFloat(product.comparePrice.amount)
    : undefined;
  const hasDiscount = compare !== undefined && compare > minPrice;
  const pctOff = hasDiscount
    ? Math.round((1 - minPrice / compare) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Image area */}
      <Link href={`/product/${product.handle}`} className="relative aspect-square w-full overflow-hidden bg-white">
        {product.featuredImage?.url ? (
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.altText || product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-contain transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-50">
            <span className="text-sm text-neutral-300">No image</span>
          </div>
        )}

        {/* Percentage off badge */}
        {hasDiscount && (
          <div className="absolute left-2 top-2 z-10 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
            -{pctOff}%
          </div>
        )}

        {/* Remove button - top right */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label="Remove from wishlist"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </Link>

      {/* Content */}
      <div className="flex flex-col bg-neutral-50 px-3 pb-3 pt-2 sm:px-4 sm:pt-3">
        <Link href={`/product/${product.handle}`}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-neutral-800 sm:text-base">
            {product.title}
          </h3>
        </Link>
        <div className="mt-1">
          {hasDiscount && product.comparePrice && (
            <span className="text-xs text-neutral-400 line-through sm:text-sm">
              <Price
                className="text-xs text-neutral-400 line-through sm:text-sm"
                amount={product.comparePrice.amount}
                currencyCode={product.currencyCode}
              />
            </span>
          )}
          <Price
            className="text-base font-bold text-blue-600 sm:text-lg"
            amount={product.priceRange.minVariantPrice.amount}
            currencyCode={product.currencyCode}
          />
        </div>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { items, remove } = useWishlist();
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/storefront/wishlist?handles=${items.join(",")}`
        );
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error("Failed to fetch wishlist products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [items]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-6 text-2xl font-bold text-neutral-900">
          My Wishlist
        </h1>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-neutral-900" />
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-6 text-2xl font-bold text-neutral-900">
          My Wishlist
        </h1>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white py-20 shadow-sm">
          <svg
            className="h-16 w-16 text-neutral-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h2 className="mt-4 text-lg font-semibold text-neutral-900">
            Your wishlist is empty
          </h2>
          <p className="mt-1 text-neutral-500">
            Save your favorite products here
          </p>
          <Link href="/shop" className="mt-6">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">
          My Wishlist
          <span className="ml-2 rounded-full bg-neutral-900 px-2.5 py-0.5 text-sm text-white">
            {products.length}
          </span>
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <WishlistCard
            key={product.id}
            product={product}
            onRemove={() => remove(product.handle)}
          />
        ))}
      </div>
    </div>
  );
}
