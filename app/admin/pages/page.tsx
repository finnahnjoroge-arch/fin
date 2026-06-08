"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PageItem {
  _id: string;
  title: string;
  slug: string;
  status: string;
  sortOrder?: number;
  updatedAt: string;
  deletedAt?: string;
}

export default function PagesPage() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/pages");
    const data = await res.json();
    if (Array.isArray(data)) {
      setPages(data);
    } else {
      setPages([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleDelete = async (page: PageItem) => {
    const isDeleted = !!page.deletedAt;
    if (isDeleted) {
      if (!confirm("Permanently delete this page? This cannot be undone.")) return;
      const res = await fetch(`/api/admin/pages/${page._id}?permanent=true`, { method: "DELETE" });
      if (res.ok) { toast.success("Page permanently deleted"); fetchPages(); }
      else { const err = await res.json(); toast.error(err.error || "Failed to delete"); }
      return;
    }
    const archive = confirm("Move this page to trash? Press Cancel to permanently delete instead.");
    if (archive) {
      const res = await fetch(`/api/admin/pages/${page._id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Page moved to trash"); fetchPages(); }
      else { const err = await res.json(); toast.error(err.error || "Failed to delete"); }
    } else {
      if (!confirm("Permanently delete this page? This cannot be undone.")) return;
      const res = await fetch(`/api/admin/pages/${page._id}?permanent=true`, { method: "DELETE" });
      if (res.ok) { toast.success("Page permanently deleted"); fetchPages(); }
      else { const err = await res.json(); toast.error(err.error || "Failed to delete"); }
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "—";
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-white">Pages</h1>
        <Link href="/admin/pages/new">
          <Button>
            <Plus className="mr-1 h-4 w-4" />
            New Page
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="px-4 py-3 text-left font-medium dark:text-white">Title</th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Slug</th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Status</th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Footer Order</th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Last updated</th>
                <th className="px-4 py-3 text-right font-medium dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  </tr>
                ))
              ) : (
                pages.map((page) => (
                  <tr
                    key={page._id}
                    className={`border-b border-neutral-100 dark:border-neutral-800 ${page.deletedAt ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium">
                      {page.title}
                      {page.deletedAt && (
                        <span className="ml-2 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Deleted
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{page.slug}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          page.status === "published"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                        }`}
                      >
                        {page.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{page.sortOrder ?? 0}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {formatDate(page.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/pages/${page._id}`}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(page)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && pages.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500 dark:text-neutral-400">
                    No pages found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


