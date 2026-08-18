import { connectDB } from "@/lib/mongodb";
import { unstable_cache } from "next/cache";

async function getBrandsFromDB() {
  const db = await connectDB();
  const docs = await db.collection("brands")
    .find()
    .sort({ createdAt: -1 })
    .toArray();

  // Return serializable, clean objects (no ObjectId/Date).
  return docs.map((b) => ({
    _id: b._id?.toString?.() || String(b._id),
    name: b.name,
    slug: b.slug,
    imageUrl: b.imageUrl,
    createdAt: b.createdAt?.toISOString?.() || b.createdAt,
    updatedAt: b.updatedAt?.toISOString?.() || b.updatedAt,
  }));
}

export const getBrands = unstable_cache(
  getBrandsFromDB,
  ["all-brands"],
  { revalidate: 3600, tags: ["brands", "all-brands"] },
);

export async function getBrandBySlug(slug: string) {
  const db = await connectDB();
  return db.collection("brands").findOne({ slug });
}
