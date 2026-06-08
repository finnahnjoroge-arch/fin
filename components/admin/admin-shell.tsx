"use client";

import Sidebar from "@/components/admin/sidebar";
import Topbar from "@/components/admin/topbar";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const ADMIN_THEME_KEY = "admin-theme";

export type AdminTheme = "light" | "dark";

function useAdminTheme(): [AdminTheme, (t: AdminTheme) => void] {
  const [theme, setThemeState] = useState<AdminTheme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(ADMIN_THEME_KEY) as
      | AdminTheme
      | null;
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
    }
  }, []);

  const setTheme = (next: AdminTheme) => {
    setThemeState(next);
    window.localStorage.setItem(ADMIN_THEME_KEY, next);
  };

  return [theme, setTheme];
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [theme, setTheme] = useAdminTheme();

  if (isLoginPage) {
    return <div className={theme === "dark" ? "dark" : undefined}>{children}</div>;
  }

  return (
    <div className={theme === "dark" ? "dark" : undefined}>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <Sidebar />
        <div className="flex flex-col md:ml-64">
          <Topbar theme={theme} setTheme={setTheme} />
          <main className="flex-1 p-3 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
