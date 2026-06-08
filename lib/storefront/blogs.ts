import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export type BlogPost = {
  _id: ObjectId | string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  status: string;
  author: string;
  metaTitle: string;
  metaDescription: string;
  publishedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export async function getBlogPosts({ page = 1, limit = 9 }: { page?: number; limit?: number }) {
  const db = await connectDB();
  const skip = (page - 1) * limit;
  const filter = { status: "published" };
  const [posts, total] = await Promise.all([
    db.collection("blogs").find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit).toArray(),
    db.collection("blogs").countDocuments(filter),
  ]);
  return { posts: posts as BlogPost[], total, page, totalPages: Math.ceil(total / limit) };
}

export async function getBlogPost(slug: string) {
  const db = await connectDB();
  return await db.collection("blogs").findOne({ slug, status: "published" }) as BlogPost | null;
}

export async function getBlogSlugs() {
  const db = await connectDB();
  return await db.collection("blogs").find({ status: "published" }).project({ slug: 1 }).toArray();
}
