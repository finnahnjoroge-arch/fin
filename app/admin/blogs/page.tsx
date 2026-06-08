"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type BlogItem = {
  _id: string;
  title: string;
  slug: string;
  status: string;
  author?: string;
  publishedAt?: string;
  updatedAt: string;
  deletedAt?: string;
};

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlogs = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/blogs");
    const data = await res.json();
    setBlogs(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDelete = async (blog: BlogItem) => {
    const isDeleted = !!blog.deletedAt;
    if (isDeleted) {
      if (!confirm("Permanently delete this blog? This cannot be undone.")) return;
      const res = await fetch(`/api/admin/blogs/${blog._id}?permanent=true`, { method: "DELETE" });
      if (res.ok) { toast.success("Blog permanently deleted"); fetchBlogs(); }
      else { const err = await res.json(); toast.error(err.error || "Failed to delete"); }
      return;
    }
    const archive = confirm("Move this blog to trash? Press Cancel to permanently delete instead.");
    if (archive) {
      const res = await fetch(`/api/admin/blogs/${blog._id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Blog moved to trash"); fetchBlogs(); }
      else { const err = await res.json(); toast.error(err.error || "Failed to delete"); }
    } else {
      if (!confirm("Permanently delete this blog? This cannot be undone.")) return;
      const res = await fetch(`/api/admin/blogs/${blog._id}?permanent=true`, { method: "DELETE" });
      if (res.ok) { toast.success("Blog permanently deleted"); fetchBlogs(); }
      else { const err = await res.json(); toast.error(err.error || "Failed to delete"); }
    }
  };

  const formatDate = (date?: string) => date ? new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(new Date(date)) : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-white">Blogs</h1>
        <Link href="/admin/blogs/new"><Button><Plus className="mr-1 h-4 w-4" />New Blog</Button></Link>
      </div>
      <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="px-4 py-3 text-left font-medium dark:text-white">Title</th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Slug</th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Status</th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Published</th>
                <th className="px-4 py-3 text-right font-medium dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}><td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td><td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td><td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td><td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td><td className="px-4 py-3"><Skeleton className="ml-auto h-4 w-16" /></td></tr>
              )) : blogs.map((blog) => (
                <tr key={blog._id} className={`border-b border-neutral-100 dark:border-neutral-800 ${blog.deletedAt ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-medium">
                    {blog.title}
                    {blog.deletedAt && (
                      <span className="ml-2 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Deleted
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{blog.slug}</td>
                  <td className="px-4 py-3"><span className={blog.status === "published" ? "inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400" : "inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"}>{blog.status}</span></td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(blog.publishedAt || blog.updatedAt)}</td>
                  <td className="px-4 py-3 text-right"><div className="flex justify-end gap-2"><Link href={`/admin/blogs/${blog._id}`}><Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button></Link><Button variant="ghost" size="icon" onClick={() => handleDelete(blog)}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></td>
                </tr>
              ))}
              {!loading && blogs.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-neutral-500 dark:text-neutral-400">No blogs found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


