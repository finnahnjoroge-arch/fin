"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface SearchProduct {
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
}

export default function MobileSearch({ navbarDark }: { navbarDark?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

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
        const res = await fetch(
          `/api/storefront/products?search=${encodeURIComponent(trimmedQuery)}&limit=5`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setResults(Array.isArray(data.products) ? data.products : []);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  const handleProductClick = (handle: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/product/${handle}`);
  };

  const handleViewAll = () => {
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open search"
        className={clsx(
          "flex h-10 w-10 items-center justify-center rounded-lg transition-colors md:hidden",
          navbarDark
            ? "text-white hover:bg-neutral-800"
            : "text-neutral-900 hover:bg-neutral-100"
        )}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-x-0 top-0 z-[60] bg-neutral-950 border-b border-neutral-800 px-3 py-2.5 shadow-xl md:hidden"
    >
      {/* Search bar row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search products..."
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleViewAll()}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 pr-9 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
          />
          <button
            type="button"
            onClick={handleViewAll}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-md bg-blue-600 p-1 hover:bg-blue-500 transition-colors"
          >
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={() => { setIsOpen(false); setQuery(""); }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:bg-neutral-800 hover:text-white transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Results dropdown */}
      {query.trim().length >= 2 && (
        <div className="absolute left-3 right-3 top-full z-[70] mt-1 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl">
          {loading ? (
            <div className="px-4 py-3 text-sm text-neutral-500">Searching...</div>
          ) : results.length ? (
            <>
              <div className="max-h-[55vh] overflow-y-auto">
                {results.map((product) => (
                  <button
                    key={product.handle}
                    onClick={() => handleProductClick(product.handle)}
                    className="flex w-full items-center gap-3 border-b border-neutral-800 px-3 py-2.5 text-left last:border-b-0 hover:bg-neutral-800 transition-colors"
                  >
                    <div className="h-10 w-10 flex-none overflow-hidden rounded-lg bg-neutral-800 ring-1 ring-neutral-700">
                      {product.featuredImage?.url ? (
                        <img
                          src={product.featuredImage.url}
                          alt={product.featuredImage.altText || product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-neutral-600">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-neutral-100">{product.title}</p>
                      {product.priceRange?.minVariantPrice?.amount ? (
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {product.priceRange.minVariantPrice.currencyCode || "KES"}{" "}
                          {Number(product.priceRange.minVariantPrice.amount).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                    <svg className="h-4 w-4 shrink-0 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
              <button
                onClick={handleViewAll}
                className="block w-full border-t border-neutral-800 px-4 py-2.5 text-center text-xs font-semibold text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
              >
                View all results →
              </button>
            </>
          ) : (
            <div className="px-4 py-3 text-sm text-neutral-500">No products found</div>
          )}
        </div>
      )}
    </div>
  );
}