import { connectDB } from "@/lib/mongodb";

export async function getBrands() {
  const db = await connectDB();
  return db.collection("brands")
    .find()
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getBrandBySlug(slug: string) {
  const db = await connectDB();
  return db.collection("brands").findOne({ slug });
}
