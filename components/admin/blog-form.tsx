"use client";

import RichTextEditor from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type BlogFormProps = {
  initialData?: {
    _id?: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featuredImage: string;
    status: string;
    author: string;
    metaTitle: string;
    metaDescription: string;
    publishedAt?: string;
  };
};

const generateSlug = (str: string) =>
  str.toLowerCase().trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function BlogForm({ initialData }: BlogFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?._id;
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    featuredImage: initialData?.featuredImage || "",
    status: initialData?.status || "draft",
    author: initialData?.author || "",
    metaTitle: initialData?.metaTitle || "",
    metaDescription: initialData?.metaDescription || "",
    publishedAt: initialData?.publishedAt ? initialData.publishedAt.slice(0, 10) : "",
  });

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({ ...prev, title, slug: slugManuallyEdited ? prev.slug : generateSlug(title) }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.slug.trim()) {
      toast.error("Slug is required");
      return;
    }
    setSaving(true);
    const url = isEditing ? `/api/admin/blogs/${initialData!._id}` : "/api/admin/blogs";
    const method = isEditing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success(isEditing ? "Blog updated" : "Blog created");
      router.push("/admin/blogs");
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to save blog");
    }
    setSaving(false);
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={form.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Blog title" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <div className="flex gap-2">
            <Input id="slug" value={form.slug} onChange={(e) => { setSlugManuallyEdited(true); setForm((p) => ({ ...p, slug: e.target.value })); }} placeholder="blog-slug" />
            <Button variant="outline" type="button" onClick={() => { setSlugManuallyEdited(false); setForm((p) => ({ ...p, slug: generateSlug(p.title) })); }}>Auto</Button>
          </div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea id="excerpt" rows={3} value={form.excerpt} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} placeholder="Short summary for blog cards" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="content">Content</Label>
          <RichTextEditor id="content" value={form.content} onChange={(content) => setForm((p) => ({ ...p, content }))} placeholder="Write the blog content..." rows={14} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="featuredImage">Featured Image URL</Label>
          <Input id="featuredImage" value={form.featuredImage} onChange={(e) => setForm((p) => ({ ...p, featuredImage: e.target.value }))} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input id="author" value={form.author} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} placeholder="Author name" />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(status) => setForm((p) => ({ ...p, status }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="publishedAt">Publish Date</Label>
          <Input id="publishedAt" type="date" value={form.publishedAt} onChange={(e) => setForm((p) => ({ ...p, publishedAt: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="metaTitle">Meta Title</Label>
          <Input id="metaTitle" value={form.metaTitle} onChange={(e) => setForm((p) => ({ ...p, metaTitle: e.target.value }))} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="metaDescription">Meta Description</Label>
          <Textarea id="metaDescription" rows={3} value={form.metaDescription} onChange={(e) => setForm((p) => ({ ...p, metaDescription: e.target.value }))} />
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        <Button onClick={handleSubmit} disabled={saving}>{saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{isEditing ? "Update Blog" : "Create Blog"}</Button>
        <Button variant="outline" onClick={() => router.push("/admin/blogs")}>Cancel</Button>
      </div>
    </div>
  );
}
