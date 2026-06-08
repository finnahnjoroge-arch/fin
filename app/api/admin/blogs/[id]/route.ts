import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

const slugify = (str: string) =>
  str.toLowerCase().trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = await connectDB();
    const { id } = await params;
    const blog = await db.collection("blogs").findOne({ _id: new ObjectId(id) });
    if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(blog);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = await connectDB();
    const { id } = await params;
    const body = await req.json();
    if (body.slug || body.title) body.slug = slugify(body.slug || body.title);
    if (body.publishedAt) body.publishedAt = new Date(body.publishedAt);
    if (body.status === "published" && !body.publishedAt) body.publishedAt = new Date();
    if (body.slug) {
      const existing = await db.collection("blogs").findOne({ slug: body.slug, _id: { $ne: new ObjectId(id) } });
      if (existing) return NextResponse.json({ error: "A blog with this slug already exists" }, { status: 409 });
    }
    const blog = await db.collection("blogs").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...body, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!blog) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(blog);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get("permanent") === "true";
    const existing = await db.collection("blogs").findOne({ _id: new ObjectId(id) });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (permanent || existing.deletedAt) {
      await db.collection("blogs").deleteOne({ _id: new ObjectId(id) });
      return NextResponse.json({ message: "Blog permanently deleted" });
    }

    await db.collection("blogs").updateOne(
      { _id: new ObjectId(id) },
      { $set: { deletedAt: new Date(), updatedAt: new Date() } }
    );
    return NextResponse.json({ message: "Blog moved to trash" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
