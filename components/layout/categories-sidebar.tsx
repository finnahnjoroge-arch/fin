"use client";

import { CategoryIcon } from "components/category-icon";
import {
  Armchair,
  ChevronDown,
  ChevronRight,
  CookingPot,
  Gamepad2,
  Home,
  Monitor,
  Plug,
  Scissors,
  Search,
  ShoppingBasket,
  Smartphone,
  Speaker,
  Tag,
  Tv,
  Watch,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useRef, useState } from "react";

const iconMap: Record<string, React.ReactNode> = {
  smartphones: <Smartphone className="h-3.5 w-3.5" />,
  "phones & tablets": <Smartphone className="h-3.5 w-3.5" />,
  "tv & audio": <Tv className="h-3.5 w-3.5" />,
  appliances: <CookingPot className="h-3.5 w-3.5" />,
  "health & beauty": <Scissors className="h-3.5 w-3.5" />,
  "home & office": <Home className="h-3.5 w-3.5" />,
  fashion: <ShoppingBasket className="h-3.5 w-3.5" />,
  computing: <Monitor className="h-3.5 w-3.5" />,
  gaming: <Gamepad2 className="h-3.5 w-3.5" />,
  electronics: <Plug className="h-3.5 w-3.5" />,
  furniture: <Armchair className="h-3.5 w-3.5" />,
  audio: <Speaker className="h-3.5 w-3.5" />,
  watches: <Watch className="h-3.5 w-3.5" />,
};

function getIcon(title: string) {
  const key = title.toLowerCase();
  for (const [k, v] of Object.entries(iconMap)) {
    if (key.includes(k)) return v;
  }
  return <Tag className="h-3.5 w-3.5" />;
}

type Category = {
  slug: string;
  title: string;
  emoji?: string;
  image?: string;
  children?: { slug: string; title: string; path: string }[];
};

export function CategoriesSidebar({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = (slug: string) =>
    setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }));

  // Filter categories and children by search query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;

    return categories
      .map((cat) => {
        const catMatch = cat.title.toLowerCase().includes(q);
        const matchedChildren = (cat.children ?? []).filter((c) =>
          c.title.toLowerCase().includes(q)
        );

        if (catMatch) return cat; // show whole category with all children
        if (matchedChildren.length > 0)
          return { ...cat, children: matchedChildren }; // show only matching children
        return null;
      })
      .filter(Boolean) as Category[];
  }, [categories, query]);

  // Auto-expand parents when searching
  const displayExpanded = useMemo(() => {
    if (!query.trim()) return expanded;
    const auto: Record<string, boolean> = {};
    filtered.forEach((cat) => {
      if (cat.children && cat.children.length > 0) auto[cat.slug] = true;
    });
    return auto;
  }, [query, filtered, expanded]);

  return (
    <div className="hidden lg:block">
      <div className="flex flex-col overflow-hidden rounded-md border border-neutral-200 bg-white shadow-sm">
        {/* Header */}
        <div className="shrink-0 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-700">
            Categories
          </h3>
        </div>

        {/* Search */}
        <div className="shrink-0 border-b border-neutral-100 px-3 py-2.5">
          <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 transition-colors focus-within:border-red-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-red-100">
            <Search className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-neutral-700 placeholder-neutral-400 outline-none"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="shrink-0 rounded text-neutral-400 hover:text-neutral-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <ul className="min-h-0 max-h-[340px] flex-1 divide-y divide-neutral-100 overflow-y-auto overflow-x-hidden">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-neutral-400">
              No categories found
            </li>
          ) : (
            filtered.map((cat) => {
              const hasChildren =
                Array.isArray(cat.children) && cat.children.length > 0;
              const isExpanded = !!displayExpanded[cat.slug];
              const isActive = pathname === `/product-category/${cat.slug}`;

              return (
                <li key={cat.slug}>
                  {/* Parent row */}
                  <div
                    className={`group flex items-center transition-colors ${
                      isActive ? "bg-red-50" : "hover:bg-neutral-50"
                    }`}
                  >
                    {/* Active indicator bar */}
                    <span
                      className={`self-stretch w-0.5 shrink-0 rounded-r transition-colors ${
                        isActive ? "bg-red-600" : "bg-transparent group-hover:bg-neutral-200"
                      }`}
                    />

                    <Link
                      href={`/product-category/${cat.slug}`}
                      className={`flex flex-1 items-center gap-2.5 px-3 py-2.5 text-[13px] ${
                        isActive
                          ? "font-semibold text-red-600"
                          : "font-medium text-neutral-700"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${
                          isActive
                            ? "bg-red-100 text-red-600"
                            : "bg-amber-50 text-amber-600 group-hover:bg-amber-100"
                        }`}
                      >
                        <CategoryIcon
                          value={cat.emoji}
                          fallback={getIcon(cat.title)}
                          iconClassName="text-current"
                        />
                      </span>
                      <span className="flex-1 truncate">{cat.title}</span>
                    </Link>

                    {hasChildren ? (
                      <button
                        onClick={() => toggle(cat.slug)}
                        aria-expanded={isExpanded}
                        aria-label={
                          isExpanded
                            ? `Collapse ${cat.title}`
                            : `Expand ${cat.title}`
                        }
                        className={`flex shrink-0 items-center justify-center px-3 py-3 transition-colors ${
                          isExpanded
                            ? "text-red-600"
                            : "text-neutral-300 hover:text-neutral-600"
                        }`}
                      >
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform duration-200 ${
                            isExpanded ? "rotate-0" : "-rotate-90"
                          }`}
                        />
                      </button>
                    ) : (
                      <span className="px-3 py-3 text-neutral-200">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Children */}
                  {hasChildren && isExpanded && (
                    <ul className="border-t border-neutral-100 bg-neutral-50/60">
                      {cat.children!.map((child) => {
                        const childActive = pathname === child.path;
                        return (
                          <li key={child.slug}>
                            <Link
                              href={child.path}
                              className={`flex items-center gap-2 border-b border-neutral-100 py-2 pl-[42px] pr-4 text-[12.5px] transition-colors hover:bg-white ${
                                childActive
                                  ? "font-semibold text-red-600"
                                  : "text-neutral-500 hover:text-neutral-800"
                              }`}
                            >
                              <span
                                className={`h-1 w-1 rounded-full shrink-0 ${
                                  childActive ? "bg-red-500" : "bg-neutral-300"
                                }`}
                              />
                              {child.title}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}