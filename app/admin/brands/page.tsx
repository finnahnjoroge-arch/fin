"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Brand {
  _id: string;
  name: string;
  slug: string;
  imageUrl: string;
  deletedAt?: string;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    imageUrl: "",
  });

  const fetchBrands = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/brands");
    const data = await res.json();
    setBrands(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const generateSlug = (name: string) =>
    name.toLowerCase().trim()
      .replace(/[''']/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugManuallyEdited ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = async () => {
    const url = editingId
      ? `/api/admin/brands/${editingId}`
      : "/api/admin/brands";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success(editingId ? "Brand updated" : "Brand created");
      setForm({ name: "", slug: "", imageUrl: "" });
      setEditingId(null);
      setSlugManuallyEdited(false);
      fetchBrands();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to save brand");
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingId(brand._id);
    setForm({
      name: brand.name,
      slug: brand.slug,
      imageUrl: brand.imageUrl || "",
    });
    setSlugManuallyEdited(true);
  };

  const handleDelete = async (brand: Brand) => {
    const isDeleted = !!brand.deletedAt;
    if (isDeleted) {
      if (!confirm("Permanently delete this brand? This cannot be undone.")) return;
      const res = await fetch(`/api/admin/brands/${brand._id}?permanent=true`, { method: "DELETE" });
      if (res.ok) { toast.success("Brand permanently deleted"); fetchBrands(); }
      else { const err = await res.json(); toast.error(err.error || "Failed to delete"); }
      return;
    }
    const archive = confirm("Move this brand to trash? Press Cancel to permanently delete instead.");
    if (archive) {
      const res = await fetch(`/api/admin/brands/${brand._id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Brand moved to trash"); fetchBrands(); }
      else { const err = await res.json(); toast.error(err.error || "Failed to delete"); }
    } else {
      if (!confirm("Permanently delete this brand? This cannot be undone.")) return;
      const res = await fetch(`/api/admin/brands/${brand._id}?permanent=true`, { method: "DELETE" });
      if (res.ok) { toast.success("Brand permanently deleted"); fetchBrands(); }
      else { const err = await res.json(); toast.error(err.error || "Failed to delete"); }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setForm((prev) => ({ ...prev, imageUrl: data.url }));
        toast.success("Image uploaded");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold dark:text-white">Brands</h1>

      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <h3 className="mb-3 font-semibold dark:text-white">
          {editingId ? "Edit Brand" : "Add Brand"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Brand name"
            />
          </div>
          <div>
            <Label>Slug</Label>
            <div className="flex gap-2">
              <Input
                value={form.slug}
                onChange={(e) => { setSlugManuallyEdited(true); setForm((p) => ({ ...p, slug: e.target.value })); }}
                placeholder="auto-generated"
              />
              <Button variant="outline" size="sm" type="button" onClick={() => { setSlugManuallyEdited(false); setForm((prev) => ({ ...prev, slug: generateSlug(prev.name) })); }}>Auto</Button>
            </div>
          </div>
          <div>
            <Label>Brand image</Label>
            {form.imageUrl ? (
              <div className="relative mb-2 h-16 w-32 overflow-hidden rounded border border-neutral-200 dark:border-neutral-700">
                <img src={form.imageUrl} alt="Brand" className="h-full w-full object-contain" />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, imageUrl: "" }))}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white hover:bg-black/80"
                >
                  ×
                </button>
              </div>
            ) : null}
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleImageUpload}
            />
            {uploading && <p className="mt-1 text-xs text-neutral-500">Uploading...</p>}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={handleSubmit}>
            <Plus className="mr-1 h-4 w-4" />
            {editingId ? "Update" : "Add"} Brand
          </Button>
          {editingId && (
            <Button variant="outline" onClick={() => {
              setEditingId(null);
              setForm({ name: "", slug: "", imageUrl: "" });
              setSlugManuallyEdited(false);
            }}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="px-4 py-3 text-left font-medium dark:text-white">Image</th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Name</th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Slug</th>
                <th className="px-4 py-3 text-right font-medium dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  </tr>
                ))
              ) : (
                brands.map((brand) => (
                  <tr
                    key={brand._id}
                    className={`border-b border-neutral-100 dark:border-neutral-800 ${brand.deletedAt ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3">
                      {brand.imageUrl ? (
                        <img src={brand.imageUrl} alt={brand.name} className="h-8 w-16 object-contain" />
                      ) : (
                        <div className="h-8 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {brand.name}
                      {brand.deletedAt && (
                        <span className="ml-2 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Deleted
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{brand.slug}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(brand)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(brand)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && brands.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-neutral-500 dark:text-neutral-400">
                    No brands found
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


