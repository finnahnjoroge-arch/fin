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
  const toggleExpanded = (handle: string) =>
    setExpanded((s) => ({ ...s, [handle]: !s[handle] }));

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, searchParams]);

  return (
    <>
      <button
        onClick={openDrawer}
        aria-label="Open menu"
        className={clsx(
          "flex h-10 w-10 items-center justify-center rounded-md transition-colors md:h-12 md:w-12",
          navbarDark
            ? "text-white hover:bg-neutral-800"
            : "text-neutral-900 hover:bg-neutral-100"
        )}
      >
        <svg className="h-6 w-6 md:h-7 md:w-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
        </svg>
      </button>

      <Transition show={isOpen}>
        <Dialog onClose={closeDrawer} className="relative z-[60]">
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
          </Transition.Child>

          {/* Panel */}
          <Transition.Child
            as={Fragment}
            enter="transition-all ease-in-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition-all ease-in-out duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="fixed bottom-0 left-0 top-0 flex w-[85%] max-w-[320px] flex-col bg-neutral-950 shadow-2xl">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Menu
                </span>
                <button
                  onClick={closeDrawer}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-700 text-neutral-400 transition-colors hover:border-neutral-500 hover:bg-neutral-800 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search */}
              <div className="border-b border-neutral-800 px-4 py-3 [&_input]:bg-neutral-900 [&_input]:text-white [&_input]:placeholder-neutral-500 [&_input]:border-neutral-700">
                <Suspense fallback={<SearchSkeleton />}>
                  <Search />
                </Suspense>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-neutral-800 bg-neutral-900">
                {(["categories", "account"] as DrawerTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={clsx(
                      "flex-1 py-3 text-center text-xs font-semibold uppercase tracking-wider transition-colors",
                      tab === t
                        ? "border-b-2 border-red-500 bg-neutral-950 text-white"
                        : "text-neutral-500 hover:text-neutral-300"
                    )}
                  >
                    {t === "categories" ? "All Categories" : "Quick Links"}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {tab === "categories" ? (
                  <nav className="flex flex-col py-2">
                    {/* All Products */}
                    <Link
                      href="/shop"
                      prefetch={true}
                      onClick={closeDrawer}
                      className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-neutral-900"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-950 text-red-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </span>
                      <span className="flex-1 text-sm font-semibold text-red-500">All Products</span>
                      <ChevronRight className="h-4 w-4 text-neutral-600 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-400" />
                    </Link>

                    <div className="mx-5 my-1 h-px bg-neutral-800" />

                    {categories.map((category) => {
                      const hasChildren =
                        Array.isArray(category.children) && category.children.length > 0;
                      const isExpanded = !!expanded[category.handle];
                      const isActive = pathname === category.path;

                      return (
                        <div key={category.handle}>
                          {/* Parent row */}
                          <div
                            className={clsx(
                              "group flex items-center gap-3 px-5 py-3 transition-colors",
                              isActive ? "bg-neutral-900" : "hover:bg-neutral-900"
                            )}
                          >
                            {/* Icon */}
                            {category.emoji ? (
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-800 ring-1 ring-neutral-700">
                                <CategoryIcon value={category.emoji} iconClassName="text-sm" />
                              </span>
                            ) : category.image ? (
                              <Image
                                src={category.image}
                                alt={category.title}
                                width={36}
                                height={36}
                                className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-neutral-700"
                              />
                            ) : (
                              <span className="h-9 w-9 shrink-0 rounded-xl bg-neutral-800 ring-1 ring-neutral-700" />
                            )}

                            {/* Label */}
                            {hasChildren ? (
                              <button
                                onClick={() => toggleExpanded(category.handle)}
                                aria-expanded={isExpanded}
                                className={clsx(
                                  "flex-1 truncate text-left text-sm font-semibold transition-colors",
                                  isActive ? "text-red-500" : "text-neutral-200 hover:text-white"
                                )}
                              >
                                {category.title}
                              </button>
                            ) : (
                              <Link
                                href={category.path}
                                prefetch={true}
                                onClick={closeDrawer}
                                className={clsx(
                                  "flex-1 truncate text-sm font-semibold transition-colors",
                                  isActive ? "text-red-500" : "text-neutral-200 hover:text-white"
                                )}
                              >
                                {category.title}
                              </Link>
                            )}

                            {/* Chevron */}
                            {hasChildren ? (
                              <button
                                onClick={() => toggleExpanded(category.handle)}
                                aria-label={isExpanded ? `Collapse ${category.title}` : `Expand ${category.title}`}
                                className={clsx(
                                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                                  isExpanded
                                    ? "bg-red-600 text-white"
                                    : "text-neutral-600 hover:bg-neutral-800 hover:text-neutral-300"
                                )}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </button>
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-600 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-400" />
                            )}
                          </div>

                          {/* Children */}
                          {hasChildren && isExpanded && (
                            <div className="mb-1 ml-[3.25rem] mr-4 flex flex-col rounded-xl border border-neutral-800 bg-neutral-900">
                              {category.children!.map((child, i) => {
                                const childActive = pathname === child.path;
                                return (
                                  <Link
                                    key={child.handle}
                                    href={child.path}
                                    prefetch={true}
                                    onClick={closeDrawer}
                                    className={clsx(
                                      "px-4 py-2.5 text-sm transition-colors hover:text-white",
                                      i !== 0 && "border-t border-neutral-800",
                                      childActive
                                        ? "font-semibold text-red-500"
                                        : "text-neutral-400"
                                    )}
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
                  <nav className="flex flex-col py-2">
                    {pages.length ? (
                      pages.map((page) => (
                        <Link
                          key={page.path}
                          href={page.path}
                          prefetch={true}
                          onClick={closeDrawer}
                          className="group flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-white"
                        >
                          {page.title}
                          <ChevronRight className="h-4 w-4 text-neutral-600 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-400" />
                        </Link>
                      ))
                    ) : (
                      <p className="px-5 py-4 text-sm text-neutral-600">No pages available.</p>
                    )}
                  </nav>
                )}
              </div>

              {/* Footer accent line */}
              <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-transparent" />
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}
