"use client";

import { WishlistProvider } from "components/wishlist/wishlist-context";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

export function Providers({
  children,
  forcedTheme = "light",
  defaultTheme = "light",
}: {
  children: ReactNode;
  forcedTheme?: string;
  defaultTheme?: string;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      forcedTheme={forcedTheme}
      enableSystem={false}
    >
      <WishlistProvider>
        {children}
      </WishlistProvider>
    </ThemeProvider>
  );
}
