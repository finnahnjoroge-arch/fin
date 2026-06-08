import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

const slugify = (str: string) =>
  str.toLowerCase().trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

export async function GET(req: NextRequest) {
  try {
    const db = await connectDB();
    const { searchParams } = new URL(req.url);
    const hideDeleted = searchParams.get("hideDeleted") === "true";
    const filter: any = {};
    if (hideDeleted) filter.deletedAt = { $exists: false };
    const blogs = await db.collection("blogs").find(filter).sort({ updatedAt: -1 }).toArray();
    return NextResponse.json(blogs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await connectDB();
    const body = await req.json();
    const now = new Date();
    const toInsert = {
      title: body.title || "",
      slug: slugify(body.slug || body.title || ""),
      excerpt: body.excerpt || "",
      content: body.content || "",
      featuredImage: body.featuredImage || "",
      status: body.status || "draft",
      author: body.author || "",
      metaTitle: body.metaTitle || "",
      metaDescription: body.metaDescription || "",
      publishedAt: body.status === "published" ? new Date(body.publishedAt || now) : body.publishedAt ? new Date(body.publishedAt) : null,
      createdAt: now,
      updatedAt: now,
    };

    const existing = await db.collection("blogs").findOne({ slug: toInsert.slug });
    if (existing) return NextResponse.json({ error: "A blog with this slug already exists" }, { status: 409 });

    const result = await db.collection("blogs").insertOne(toInsert);
    return NextResponse.json({ ...toInsert, _id: result.insertedId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
