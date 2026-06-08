"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export default function ContactDropdown({
  storePhone,
  whatsappPhone,
  navbarDark,
}: {
  storePhone?: string;
  whatsappPhone?: string;
  navbarDark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dark = navbarDark;

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // Use mousedown for immediate response, use click as fallback
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={clsx(
          "flex items-center gap-1 rounded-lg px-1.5 py-1.5 text-sm font-semibold transition-colors md:px-3 md:py-2",
          dark
            ? "text-white hover:bg-neutral-800"
            : "text-neutral-900 hover:bg-neutral-100",
          open && (dark ? "bg-neutral-800" : "bg-neutral-100"),
        )}
      >
        <svg className={clsx("h-4.5 w-4.5 md:h-5 md:w-5", dark ? "text-white" : "text-neutral-900")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span className="hidden sm:inline">Contact</span>
        <svg
          className={clsx(
            "hidden h-3.5 w-3.5 transition-transform duration-200 sm:inline",
            dark ? "text-neutral-400" : "text-neutral-500",
            open && "rotate-180",
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className={clsx(
            "absolute right-0 top-full z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-xl shadow-lg ring-1 ring-black/5 animate-fadeIn",
            dark
              ? "border border-neutral-700 bg-neutral-900"
              : "border border-neutral-200 bg-white",
          )}
        >
          {/* Call */}
          <a
            href={`tel:${storePhone?.replace(/\D/g, "")}`}
            onClick={() => setOpen(false)}
            role="menuitem"
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 transition-colors",
              dark ? "hover:bg-neutral-800" : "hover:bg-neutral-50",
            )}
          >
            <span className={clsx(
              "flex h-8 w-8 flex-none items-center justify-center rounded-full",
              dark ? "bg-blue-900/40 text-blue-400" : "bg-blue-50 text-blue-600",
            )}>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className={clsx("text-sm font-medium", dark ? "text-white" : "text-neutral-900")}>
                Call {storePhone}
              </p>
            </div>
          </a>

          {/* WhatsApp */}
          {whatsappPhone && (
            <a
              href={`https://wa.me/${whatsappPhone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              role="menuitem"
              className={clsx(
                "flex items-center gap-3 border-t px-3 py-2.5 transition-colors",
                dark
                  ? "border-neutral-700 hover:bg-neutral-800"
                  : "border-neutral-100 hover:bg-neutral-50",
              )}
            >
              <span className={clsx(
                "flex h-8 w-8 flex-none items-center justify-center rounded-full",
                dark ? "bg-green-900/40 text-green-400" : "bg-green-50 text-green-600",
              )}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.35 5.01L2 22l5.09-1.34A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.58 0-3.05-.46-4.3-1.26l-.31-.19-3.06.8.82-2.83-.21-.33A8.02 8.02 0 014 12c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8-8 8z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className={clsx("text-sm font-medium", dark ? "text-white" : "text-neutral-900")}>
                  WhatsApp
                </p>
              </div>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
