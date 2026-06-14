"use client";

import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, verticalOnMobile = false, centerOnMobile = false, hideLastOnMobile = false, titleOnMobile = false }: { items: Crumb[]; verticalOnMobile?: boolean; centerOnMobile?: boolean; hideLastOnMobile?: boolean; titleOnMobile?: boolean }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? `https://watchesinkenya.co.ke${item.href}` : undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="py-0">
                <ol className={clsx("flex items-center gap-1 text-xs text-neutral-600", centerOnMobile ? "justify-center sm:justify-start" : "justify-start", verticalOnMobile ? "flex-col sm:flex-row sm:flex-wrap" : "flex-wrap")}>
          {items.map((item, index) => {
            const hideOnMobile = hideLastOnMobile && index === items.length - 1;
            return (
              <li key={index} className={clsx("flex items-center gap-1", hideOnMobile ? "hidden sm:flex" : "flex")}>
                {index > 0 && (
                  <ChevronRight className={clsx("h-4 w-4 text-neutral-400", verticalOnMobile && "hidden sm:block")} />
                )}
                                                                {item.href && index < items.length - 1 ? (
                  <Link
                    href={item.href}
                    className="truncate text-neutral-900 hover:underline sm:max-w-none sm:whitespace-normal"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={clsx("truncate text-neutral-900 sm:max-w-none sm:whitespace-normal", titleOnMobile && index === items.length - 1 && "text-sm font-bold sm:text-xs sm:font-normal")}>{item.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
