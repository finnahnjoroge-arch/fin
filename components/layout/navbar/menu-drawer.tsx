"use client";

import { Dialog, Transition } from "@headlessui/react";
import clsx from "clsx";
import { CategoryIcon } from "components/category-icon";
import { Collection, Menu } from "lib/sfcc/types";
import { ChevronDown, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useEffect, useState } from "react";
import Search, { SearchSkeleton } from "./search";

type DrawerTab = "categories" | "account";

export default function MenuDrawer({
  categories,
  pages,
  navbarDark,
}: {
  categories: Collection[];
  pages: Menu[];
  navbarDark?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<DrawerTab>("categories");

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpanded = (handle: string) => setExpanded((s) => ({ ...s, [handle]: !s[handle] }));

  // Close when the route changes (after a link is clicked).
  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  return (
    <>
      <button
        onClick={openDrawer}
        aria-label="Open menu"
        className={clsx("flex h-9 w-9 items-center justify-center rounded-md md:h-11 md:w-11 transition-colors", navbarDark ? "border-neutral-700 text-white hover:bg-neutral-800" : "border-neutral-200 text-neutral-900 hover:bg-neutral-50")}
      >
        <svg className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
        </svg>
      </button>

      <Transition show={isOpen}>
        <Dialog onClose={closeDrawer} className="relative z-[60]">
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-100 backdrop-blur-[.5px]"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100 backdrop-blur-[.5px]"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="translate-x-[-100%]"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-[-100%]"
          >
            <Dialog.Panel className="fixed bottom-0 left-0 top-0 flex w-[82%] max-w-[300px] flex-col bg-white shadow-xl">
              {/* Header / Close */}
              <div className="flex items-center justify-end border-b border-neutral-200 px-4 py-3">
                <button
                  onClick={closeDrawer}
                  aria-label="Close menu"
                  className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900 transition-colors hover:text-neutral-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </button>
              </div>

              {/* Search */}
              <div className="border-b border-neutral-200 px-4 py-3">
                <Suspense fallback={<SearchSkeleton />}>
                  <Search />
                </Suspense>
              </div>

                                                                                    {/* Tabs */}
                                          <div className="flex border-b border-neutral-200">
                                            <button
                                              onClick={() => setTab("categories")}
                                              className={`flex-1 border-b-2 px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide transition-colors ${
                                                tab === "categories"
                                                  ? "border-red-600 text-neutral-900"
                                                  : "border-transparent text-neutral-400 hover:text-neutral-600"
                                              }`}
                                            >
                                              All Categories
                                            </button>
                                            <button
                                              onClick={() => setTab("account")}
                                              className={`flex-1 border-b-2 px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide transition-colors ${
                                                tab === "account"
                                                  ? "border-red-600 text-neutral-900"
                                                  : "border-transparent text-neutral-400 hover:text-neutral-600"
                                              }`}
                                            >
                                              Quick Links
                                            </button>
                                          </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {tab === "categories" ? (
                  <nav className="flex flex-col">
                    <div className="flex items-stretch border-b border-neutral-100">
                      <Link
                        href="/shop"
                        prefetch={true}
                        onClick={closeDrawer}
                        className="flex-1 px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-red-600 transition-colors hover:bg-neutral-50"
                      >
                        ALL PRODUCTS
                      </Link>
                      <span className="flex shrink-0 items-center justify-center px-4 text-neutral-300">
                        <ChevronRight className="h-5 w-5" />
                      </span>
                    </div>
                    {categories.map((category) => {
                      const hasChildren = Array.isArray(category.children) && category.children.length > 0;
                      const isExpanded = !!expanded[category.handle];
                      const isActive = pathname === category.path;

                      return (
                        <div key={category.handle} className="border-b border-neutral-100">
                          {/* Parent row */}
                          <div className="flex items-stretch">
                            {/* Icon + Title */}
                            <div className="flex flex-1 items-center gap-3 px-4 py-3.5">
                              {category.emoji ? (
                                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm">
                                  <CategoryIcon value={category.emoji} iconClassName="text-sm text-neutral-900" />
                                </span>
                              ) : category.image ? (
                                <Image src={category.image} alt={category.title} width={32} height={32} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                              ) : null}

                              {hasChildren ? (
                                <button
                                  onClick={() => toggleExpanded(category.handle)}
                                  aria-expanded={isExpanded}
                                  className={`truncate text-left text-sm font-bold uppercase tracking-wide transition-colors ${
                                    isExpanded ? "text-neutral-900" : isActive ? "text-red-600" : "text-neutral-900"
                                  }`}
                                >
                                  {category.title}
                                </button>
                              ) : (
                                <Link
                                  href={category.path}
                                  prefetch={true}
                                  onClick={closeDrawer}
                                  className={`truncate text-sm font-bold uppercase tracking-wide transition-colors ${
                                    isActive ? "text-red-600" : "text-neutral-900"
                                  }`}
                                >
                                  {category.title}
                                </Link>
                              )}
                            </div>

                            {/* Chevron button */}
                            {hasChildren ? (
                              <button
                                onClick={() => toggleExpanded(category.handle)}
                                aria-expanded={isExpanded}
                                aria-label={isExpanded ? `Collapse ${category.title}` : `Expand ${category.title}`}
                                className={`flex shrink-0 items-center justify-center px-4 transition-colors ${
                                  isExpanded ? "bg-red-600 text-white" : "text-neutral-400 hover:text-neutral-700"
                                }`}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                              </button>
                            ) : (
                              <span className="flex shrink-0 items-center justify-center px-4 text-neutral-300">
                                <ChevronRight className="h-5 w-5" />
                              </span>
                            )}
                          </div>

                          {/* Children list */}
                          {hasChildren && isExpanded && (
                            <div className="flex flex-col border-t border-neutral-100 bg-white">
                              {category.children!.map((child) => {
                                const childActive = pathname === child.path;
                                return (
                                  <Link
                                    key={child.handle}
                                    href={child.path}
                                    prefetch={true}
                                    onClick={closeDrawer}
                                    className={`border-b border-neutral-100 py-3 pl-10 pr-4 text-sm transition-colors hover:bg-neutral-50 ${
                                      childActive ? "font-semibold text-red-600" : "font-normal text-neutral-500"
                                    }`}
                                  >
                                    {child.title}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </nav>
                ) : (
                  <nav className="flex flex-col">
                    {pages.length ? (
                      pages.map((page) => (
                        <Link
                          key={page.path}
                          href={page.path}
                          prefetch={true}
                          onClick={closeDrawer}
                          className="border-b border-neutral-100 px-4 py-3.5 text-sm font-semibold uppercase tracking-wide text-neutral-900 transition-colors hover:bg-neutral-50"
                        >
                          {page.title}
                        </Link>
                      ))
                    ) : (
                      <p className="px-4 py-3.5 text-sm text-neutral-500">
                        No pages available.
                      </p>
                    )}
                  </nav>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}
