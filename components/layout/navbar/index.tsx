"use client";

import clsx from "clsx";
import LogoSquare from "components/logo-square";
import { Collection, Menu } from "lib/sfcc/types";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import MenuDrawer from "./menu-drawer";
import MobileSearch from "./mobile-search";
import ProfileDropdown from "./profile-dropdown";
import Search, { SearchSkeleton } from "./search";

const CartModal = dynamic(() => import("components/cart/modal"), { ssr: false });

export function Navbar({
  menu,
  categories,
  pages = [],
  settings,
}: {
  menu: any[];
  categories: Collection[];
  pages?: Menu[];
  settings: Record<string, any>;
}) {
  const iconUrl = settings.faviconUrl && settings.faviconUrl !== "/favicon.ico" ? settings.faviconUrl : undefined;
  const pathname = usePathname();
  const isProductPage = pathname?.startsWith("/product/") ?? false;
  const isCheckout = pathname?.startsWith("/checkout") ?? false;
  const dark = Boolean(settings?.navbarDark);


  return (
    <nav className={clsx("sticky top-0 z-50 shadow-md", dark ? "bg-black" : "bg-white")}>
      {/* Main navbar */}
      <div className={clsx("px-3 pb-2 pt-2 lg:px-6 lg:pb-3 lg:pt-3", dark ? "border-neutral-700" : "border-neutral-200")}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 md:gap-4">
          {/* Left: Hamburger Menu + Mobile Search + Logo (centered on mobile) */}
          <div className="flex flex-1 items-center gap-1.5 md:gap-4 md:flex-none">
            {/* Hamburger Drawer Menu */}
            <MenuDrawer categories={categories} pages={pages} navbarDark={dark} />

            {/* Mobile Search - expands to search bar when clicked */}
            <MobileSearch navbarDark={dark} />

            {/* Logo - centered on mobile, left on desktop */}
            <Link
              href="/"
              prefetch={true}
              className="flex flex-1 flex-shrink-0 items-center justify-center gap-1.5 md:flex-none md:justify-start md:gap-2"
            >
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName}
                  className="h-8 w-auto max-w-[130px] object-contain md:h-10 md:max-w-[150px]"
                />
              ) : (
                <>
                  {settings.showLogoIcon && (
                    <LogoSquare iconUrl={iconUrl} logoIconUrl={settings.logoIconUrl || undefined} />
                  )}
                  <div className={clsx("text-sm font-bold md:text-base", dark ? "text-white" : "text-black")}>
                    {settings.storeName}
                  </div>
                </>
              )}
            </Link>
          </div>

          {/* Center: Search Bar - desktop only */}
          {!isCheckout && (
            <div className="hidden flex-1 max-w-md md:block">
              <Suspense fallback={<SearchSkeleton />}>
                <Search />
              </Suspense>
            </div>
          )}

                    {/* Right: Profile Dropdown + Cart */}
          <div className="flex items-center gap-1.5 md:gap-4">
            {/* Profile Dropdown */}
            <ProfileDropdown navbarDark={dark} />

            {/* Cart Icon */}
            <CartModal navbarDark={dark} />
          </div>
        </div>
      </div>
    </nav>
  );
}

