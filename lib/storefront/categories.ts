import { connectDB } from "@/lib/mongodb";
import { Collection, SEO } from "lib/sfcc/types";
import { unstable_cache } from "next/cache";

function mapCategory(doc: any): Collection {
  const seo: SEO = { title: doc.name, description: doc.description || "" };
  return {
    handle: doc.slug,
    title: doc.name,
    description: doc.description || "",
    seo,
    updatedAt: doc.updatedAt?.toISOString?.() || new Date().toISOString(),
    path: `/product-category/${doc.slug}`,
    emoji: doc.emoji,
    image: doc.image,
    // include children if provided by aggregation
    children: (doc.children || []).map((c: any) => ({ handle: c.slug || c._id?.toString?.(), title: c.name, path: c.slug ? `/product-category/${c.slug}` : `#` })),
  };
}

async function getAllCategoriesFromDB() {
  const db = await connectDB();

  // Aggregate so we can include children for each category
  const docs = await db.collection("categories").aggregate([
    { $sort: { position: 1, name: 1 } },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "parent",
        as: "children",
      },
    },
  ]).toArray();

      return docs.map(mapCategory);
}

export const getAllCategories = unstable_cache(
  getAllCategoriesFromDB,
  ["all-categories"],
  { revalidate: 3600, tags: ["categories", "all-categories"] },
);

export async function getCategoryBySlug(slug: string) {
  const db = await connectDB();
  const doc = await db.collection("categories").findOne({ slug });
  if (!doc) return null;
  return mapCategory(doc);
}

export async function getCollections() {
  return getAllCategories();
}

export async function getCollection(handle: string) {
  return getCategoryBySlug(handle);
}
