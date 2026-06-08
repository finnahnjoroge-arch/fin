"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Form from "next/form";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type SearchProduct = {
  handle: string;
  title: string;
  featuredImage?: {
    url?: string;
    altText?: string;
  };
  priceRange?: {
    minVariantPrice?: {
      amount?: string;
      currencyCode?: string;
    };
  };
};

export default function Search() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/storefront/products?search=${encodeURIComponent(trimmedQuery)}&limit=5`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(Array.isArray(data.products) ? data.products : []);
      } catch (error) {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  return (
    <Form
      action="/search"
      prefetch={false}
      className="w-max-[550px] relative w-full lg:w-80 xl:w-full"
      onFocus={() => setOpen(true)}
      onBlur={() => window.setTimeout(() => setOpen(false), 150)}
    >
      <div className="relative flex items-center">
        <input
          type="text"
          name="q"
          placeholder="Search products, brands..."
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className="w-full rounded-full border border-neutral-300 bg-white px-3 py-2 pr-10 text-sm text-neutral-900 placeholder:text-neutral-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 md:px-4 md:py-2.5 md:pr-12"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-neutral-100 p-1.5 md:p-2">
          <MagnifyingGlassIcon className="h-4 w-4 text-neutral-600" />
        </div>
      </div>
      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl">
          {loading ? (
            <div className="px-4 py-3 text-sm text-neutral-500">Searching...</div>
          ) : results.length ? (
            <>
              <div className="max-h-80 overflow-y-auto">
                {results.map((product) => (
                  <Link
                    key={product.handle}
                    href={`/product/${product.handle}`}
                    className="flex items-center gap-3 border-b border-neutral-100 px-3 py-2 last:border-b-0 hover:bg-neutral-100"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setOpen(false);
                      router.push(`/product/${product.handle}`);
                    }}
                    onClick={() => setOpen(false)}
                  >
                    <div className="h-12 w-12 flex-none overflow-hidden rounded-md bg-neutral-100">
                      {product.featuredImage?.url ? (
                        <img
                          src={product.featuredImage.url}
                          alt={product.featuredImage.altText || product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-black">
                        {product.title}
                      </p>
                      {product.priceRange?.minVariantPrice?.amount ? (
                        <p className="mt-1 text-xs text-neutral-500">
                          {product.priceRange.minVariantPrice.currencyCode || "KES"}{" "}
                          {Number(product.priceRange.minVariantPrice.amount).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                className="block border-t border-neutral-100 px-4 py-2 text-center text-sm font-medium hover:bg-neutral-100"
                onClick={() => setOpen(false)}
              >
                View all results
              </Link>
            </>
          ) : (
            <div className="px-4 py-3 text-sm text-neutral-500">No products found</div>
          )}
        </div>
      ) : null}
    </Form>
  );
}

export function SearchSkeleton() {
  return (
    <form className="w-max-[550px] relative w-full lg:w-80 xl:w-full">
      <div className="relative flex items-center">
        <input
          placeholder="Search products, brands..."
          className="w-full rounded-full border border-neutral-300 bg-white px-3 py-2 pr-10 text-sm text-neutral-900 placeholder:text-neutral-500 md:px-4 md:py-2.5 md:pr-12"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-neutral-100 p-1.5 md:p-2">
          <MagnifyingGlassIcon className="h-4 w-4 text-neutral-600" />
        </div>
      </div>
    </form>
  );
}

