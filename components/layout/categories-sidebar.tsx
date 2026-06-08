"use client";

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
  ShoppingBasket,
  Smartphone,
  Speaker,
  Tv,
  Watch,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const iconMap: Record<string, React.ReactNode> = {
  smartphones: <Smartphone className="h-4 w-4" />,
  "phones & tablets": <Smartphone className="h-4 w-4" />,
  "tv & audio": <Tv className="h-4 w-4" />,
  appliances: <CookingPot className="h-4 w-4" />,
  "health & beauty": <Scissors className="h-4 w-4" />,
  "home & office": <Home className="h-4 w-4" />,
  fashion: <ShoppingBasket className="h-4 w-4" />,
  computing: <Monitor className="h-4 w-4" />,
  gaming: <Gamepad2 className="h-4 w-4" />,
  electronics: <Plug className="h-4 w-4" />,
  furniture: <Armchair className="h-4 w-4" />,
  audio: <Speaker className="h-4 w-4" />,
  watches: <Watch className="h-4 w-4" />,
};

function getIcon(title: string) {
  const key = title.toLowerCase();
  for (const [k, v] of Object.entries(iconMap)) {
    if (key.includes(k)) return v;
  }
  return <ChevronRight className="h-4 w-4" />;
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

  const toggle = (slug: string) =>
    setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }));

  return (
    <div className="hidden lg:block">
      <div className="flex h-[392px] flex-col overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm">
        {/* Header */}
        <div className="shrink-0 border-b border-neutral-200 px-4 py-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-900">
            Categories
          </h3>
        </div>

        <ul className="min-h-0 flex-1 divide-y divide-neutral-100 overflow-y-auto overflow-x-hidden">
          {categories.map((cat) => {
            const hasChildren = Array.isArray(cat.children) && cat.children.length > 0;
            const isExpanded = !!expanded[cat.slug];
            const isActive = pathname === `/product-category/${cat.slug}`;

            return (
              <li key={cat.slug}>
                {/* Parent row */}
                <div className="flex items-center justify-between">
                  <Link
                    href={`/product-category/${cat.slug}`}
                    className={`group flex flex-1 items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-neutral-50 ${
                      isActive ? "text-red-600 font-semibold" : "text-neutral-800 font-medium"
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                      {cat.emoji || getIcon(cat.title)}
                    </span>
                    <span className="flex-1 truncate">{cat.title}</span>
                  </Link>

                  {hasChildren ? (
                    <button
                      onClick={() => toggle(cat.slug)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? `Collapse ${cat.title}` : `Expand ${cat.title}`}
                      className={`flex h-full shrink-0 items-center justify-center px-3 py-2.5 transition-colors ${
                        isExpanded
                          ? "bg-red-600 text-white"
                          : "text-neutral-400 hover:text-neutral-700"
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <span className="px-3 py-2.5 text-neutral-300">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                  <ul className="border-t border-neutral-100 bg-white">
                    {cat.children!.map((child) => {
                      const childActive = pathname === child.path;
                      return (
                        <li key={child.slug}>
                          <Link
                            href={child.path}
                            className={`block border-b border-neutral-100 py-2 pl-10 pr-4 text-sm transition-colors hover:bg-neutral-50 ${
                              childActive
                                ? "font-semibold text-red-600"
                                : "text-neutral-500"
                            }`}
                          >
                            {child.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
