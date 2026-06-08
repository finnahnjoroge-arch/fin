import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

const slugify = (str: string) =>
  str.toLowerCase().trim()
    .replace(/[''']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectDB();
    const { id } = await params;
        const body = await req.json();
    // normalize parent and slug
    if (body.slug || body.name) body.slug = slugify(body.slug || body.name);
    if (body.parent === "none" || body.parent === null || body.parent === undefined || body.parent === "") {
      body.parent = null;
    } else {
      try {
        body.parent = new ObjectId(body.parent);
      } catch (e) {
        body.parent = null;
      }
    }

    const category = await db.collection("categories").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...body, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get("permanent") === "true";
    const existing = await db.collection("categories").findOne({ _id: new ObjectId(id) });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (permanent || existing.deletedAt) {
      const productCount = await db.collection("products").countDocuments({ category: new ObjectId(id) });
      if (productCount > 0) {
        return NextResponse.json({ error: "Cannot delete category with products" }, { status: 400 });
      }
      await db.collection("categories").deleteOne({ _id: new ObjectId(id) });
      return NextResponse.json({ message: "Category permanently deleted" });
    }

    await db.collection("categories").updateOne(
      { _id: new ObjectId(id) },
      { $set: { deletedAt: new Date(), updatedAt: new Date() } }
    );
    return NextResponse.json({ message: "Category moved to trash" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
