"use client";

import clsx from "clsx";
import LogoSquare from "components/logo-square";
import { Collection, Menu } from "lib/sfcc/types";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import ContactDropdown from "./contact-dropdown";
import MenuDrawer from "./menu-drawer";
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
          {/* Left: Hamburger Menu + Logo */}
          <div className="flex items-center gap-1.5 md:gap-4">
            {/* Hamburger Drawer Menu */}
            <MenuDrawer categories={categories} pages={pages} navbarDark={dark} />

            {/* Logo */}
            <Link
              href="/"
              prefetch={true}
              className="flex flex-shrink-0 items-center gap-1.5 md:gap-2"
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

          {/* Center: Search Bar */}
          {!isCheckout && (
            <div className="hidden flex-1 max-w-md md:block">
              <Suspense fallback={<SearchSkeleton />}>
                <Search />
              </Suspense>
            </div>
          )}

          {/* Right: Contact Dropdown + Cart */}
          <div className="flex items-center gap-1.5 md:gap-4">
            {/* Contact Dropdown */}
            <ContactDropdown storePhone={settings.storePhone} whatsappPhone={settings.whatsappPhone} navbarDark={dark} />

            {/* Cart Icon */}
            <CartModal navbarDark={dark} />
          </div>
        </div>

        {/* Mobile search */}
        {!isProductPage && !isCheckout && (
                    <div className="block md:hidden pb-2">
            <Suspense fallback={<SearchSkeleton />}>
              <Search />
            </Suspense>
          </div>
        )}
      </div>
    </nav>
  );
}

