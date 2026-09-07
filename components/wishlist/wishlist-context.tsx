"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface WishlistContextType {
  items: string[]; // product handles
  add: (handle: string) => void;
  remove: (handle: string) => void;
  toggle: (handle: string) => void;
  has: (handle: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = "wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    // dispatch a custom event so navbar wishlist count can update
    window.dispatchEvent(new CustomEvent("wishlist-updated"));
  }, [items, hydrated]);

  const add = (handle: string) => {
    setItems((prev) => (prev.includes(handle) ? prev : [...prev, handle]));
  };

  const remove = (handle: string) => {
    setItems((prev) => prev.filter((h) => h !== handle));
  };

  const toggle = (handle: string) => {
    setItems((prev) =>
      prev.includes(handle) ? prev.filter((h) => h !== handle) : [...prev, handle]
    );
  };

  const has = (handle: string) => items.includes(handle);

  return (
    <WishlistContext.Provider value={{ items, add, remove, toggle, has }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
