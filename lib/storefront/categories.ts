import { connectDB } from "@/lib/mongodb";
import { Collection, SEO } from "lib/sfcc/types";

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

export async function getAllCategories() {
  const db = await connectDB();

  // Aggregate so we can include children for each category
  const docs = await db.collection("categories").aggregate([
    { $sort: { name: 1 } },
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
