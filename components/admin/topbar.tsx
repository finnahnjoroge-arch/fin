"use client";

import type { AdminTheme } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun } from "lucide-react";
import { signOut } from "next-auth/react";

export default function Topbar({
  theme,
  setTheme,
}: {
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white pl-14 pr-4 dark:border-neutral-700 dark:bg-neutral-900 md:pl-6 md:pr-6">
      <div />
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </header>
  );
}

