"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, ChevronDown, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ── Modal wrapper ──────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  // close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-700">
          <div>{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Custom searchable parent combobox ──────────────────────────────────────────
function ParentCombobox({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { _id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const allOptions = [{ _id: "none", name: "No parent category" }, ...options];
  const filtered = allOptions.filter((o) =>
    o.name.toLowerCase().includes(query.toLowerCase())
  );
  const selected = allOptions.find((o) => o._id === value);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setQuery(""); }}
        className="flex h-10 w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 ring-offset-white focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:ring-offset-neutral-950 dark:focus:ring-neutral-300"
      >
        <span className="truncate">{selected?.name ?? "No parent category"}</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
            <Search className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories…"
              className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100"
            />
          </div>
          {/* List – max 6 rows then scroll */}
          <ul className="max-h-[216px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-neutral-400">No results</li>
            ) : (
              filtered.map((o) => (
                <li key={o._id}>
                  <button
                    type="button"
                    onClick={() => { onChange(o._id); setOpen(false); setQuery(""); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <Check className={`h-4 w-4 shrink-0 ${value === o._id ? "opacity-100 text-neutral-900 dark:text-neutral-100" : "opacity-0"}`} />
                    {o.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  emoji?: string;
  parent?: { _id: string; name: string } | null;
  deletedAt?: string;
  position?: number;
}

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  image: "",
  emoji: "",
  parent: "none",
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);

  // Collapse state for tree
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [allOpen, setAllOpen] = useState<boolean>(true);

  const fetchCategories = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // default-open parent categories whenever categories change
  useEffect(() => {
    const opens: Record<string, boolean> = {};
    for (const c of categories) {
      if (categories.some((ch) => (ch.parent?._id?.toString() || null) === c._id)) {
        opens[c._id] = true;
      }
    }
    // if user hasn't toggled global state, keep defaults; otherwise respect allOpen
    if (allOpen) setOpenMap((m) => ({ ...opens, ...m }));
    else setOpenMap((m) => ({ ...m }));
  }, [categories]);

  const toggleAll = () => {
    if (allOpen) {
      // collapse all
      setOpenMap({});
      setAllOpen(false);
    } else {
      // expand all parents which have children
      const opens: Record<string, boolean> = {};
      for (const c of categories) {
        if (categories.some((ch) => (ch.parent?._id?.toString() || null) === c._id)) {
          opens[c._id] = true;
        }
      }
      setOpenMap(opens);
      setAllOpen(true);
    }
  }


  const resetForm = () => {
  setForm(emptyForm);
  setEditingId(null);
  setEditingName("");
  setSlugManuallyEdited(false);
  setModalOpen(false);
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
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

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Upload failed");
      }

      setForm((prev) => ({ ...prev, image: data.url }));
      toast.success("Category image uploaded");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async () => {
    const url = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories";

    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        image: form.image.trim(),
        emoji: form.emoji.trim(),
        parent: form.parent === "none" ? null : form.parent,
      }),
    });

    if (res.ok) {
      toast.success(editingId ? "Category updated" : "Category created");
      resetForm();
      fetchCategories();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to save category");
    }
  };

  const handleEdit = (cat: Category) => {
  setEditingId(cat._id);
  setEditingName(cat.name);
  setSlugManuallyEdited(true);
  setForm({
  name: cat.name,
  slug: cat.slug,
  description: cat.description || "",
  image: cat.image || "",
  emoji: cat.emoji || "",
  parent: cat.parent?._id?.toString() || "none",
  });
  setModalOpen(true);
  };

  const handleDelete = async (cat: Category) => {
    const isDeleted = !!cat.deletedAt;
    if (isDeleted) {
      if (!confirm("Permanently delete this category? This cannot be undone.")) return;
      const res = await fetch(`/api/admin/categories/${cat._id}?permanent=true`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Category permanently deleted");
        fetchCategories();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete");
      }
      return;
    }

    const archive = confirm("Move this category to trash? Press Cancel to permanently delete instead.");
    if (archive) {
      const res = await fetch(`/api/admin/categories/${cat._id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Category moved to trash");
        fetchCategories();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete");
      }
    } else {
      if (!confirm("Permanently delete this category? This cannot be undone.")) return;
      const res = await fetch(`/api/admin/categories/${cat._id}?permanent=true`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Category permanently deleted");
        fetchCategories();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete");
      }
    }
  };

  // Simple flat list renderer (original layout)
  const renderRowFlat = (cat: Category) => (
    <tr key={cat._id} className={`border-b border-neutral-100 dark:border-neutral-800 ${cat.deletedAt ? "opacity-50" : ""}`}>
      <td className="px-4 py-3">
        <div className="relative h-8 w-8 overflow-hidden rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
          {cat.image ? (
            <Image src={cat.image} alt={cat.name} fill className="object-cover" unoptimized />
          ) : cat.emoji ? (
            <div className="flex h-full w-full items-center justify-center text-sm">{cat.emoji}</div>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-neutral-900 dark:text-white">
        <div className="flex items-center gap-2">
          <span>{cat.name}</span>
          {cat.deletedAt && (
            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">Deleted</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-neutral-500">{cat.slug}</td>
      <td className="px-4 py-3">{cat.parent?.name || "-"}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(cat)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold dark:text-white">Categories</h1>
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" />
          Add Category
        </Button>
      </div>
      <Modal
        open={modalOpen}
        onClose={resetForm}
        title={
          <div className="flex items-center gap-3">
            {editingId ? (
              <>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Pencil className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Editing category</p>
                  <p className="font-semibold text-neutral-900 dark:text-white">{editingName}</p>
                </div>
              </>
            ) : (
              <>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <Plus className="h-4 w-4" />
                </span>
                <p className="font-semibold text-neutral-900 dark:text-white">New Category</p>
              </>
            )}
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Category name"
            />
          </div>
          <div>
            <Label>Slug</Label>
            <div className="flex gap-2">
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setForm((p) => ({ ...p, slug: e.target.value }));
                }}
                placeholder="auto-generated"
              />
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setSlugManuallyEdited(false);
                  setForm((prev) => ({ ...prev, slug: generateSlug(prev.name) }));
                }}
              >
                Auto
              </Button>
            </div>
          </div>
          <div>
            <Label>Parent</Label>
            <ParentCombobox
              value={form.parent}
              onChange={(v) => setForm((p) => ({ ...p, parent: v }))}
              options={categories.filter((c) => c._id !== editingId)}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional description"
            />
          </div>
          <div className="lg:col-span-2">
            <Label className="mb-2 block">Thumbnail</Label>
            <div className="grid grid-cols-2 gap-4">
              {/* Image upload container */}
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Image</p>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900">
                    {form.image ? (
                      <>
                        <Image src={form.image} alt="Category thumbnail preview" fill className="object-cover" unoptimized />
                        <button
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, image: "" }))}
                          className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                          aria-label="Remove image"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[9px] uppercase tracking-wide text-neutral-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <Input type="file" accept="image/*" disabled={uploadingImage} onChange={handleImageUpload} className="text-xs" />
                    {uploadingImage && <p className="text-xs text-neutral-500">Uploading…</p>}
                  </div>
                </div>
              </div>

              {/* Emoji icon container */}
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Icon</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-neutral-200 bg-neutral-100 text-2xl dark:border-neutral-700 dark:bg-neutral-900">
                    {form.emoji || <span className="text-[9px] uppercase tracking-wide text-neutral-400">No icon</span>}
                  </div>
                  <div className="flex-1">
                    <Input
                      value={form.emoji}
                      onChange={(e) => setForm((p) => ({ ...p, emoji: e.target.value }))}
                      placeholder="e.g. 🪴"
                      maxLength={3}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleSubmit}>
            {editingId ? <><Pencil className="mr-1 h-4 w-4" />Update Category</> : <><Plus className="mr-1 h-4 w-4" />Add Category</>}
          </Button>
          <Button variant="outline" onClick={resetForm}>
            Cancel
          </Button>
        </div>
      </Modal>
      <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="px-4 py-3 text-left font-medium">Preview</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Slug</th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Parent</th>
                <th className="px-4 py-3 text-right font-medium dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-10 w-10 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-4 w-16" /></td>
                  </tr>
                ))
              ) : (
                categories.map((cat) => renderRowFlat(cat))
              )}
              {!loading && categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500 dark:text-neutral-400">
                    No categories found
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


