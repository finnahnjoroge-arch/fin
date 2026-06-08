import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

const slugify = (str: string) =>
  str.toLowerCase().trim()
    .replace(/[''']/g, "")
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
    const brands = await db.collection("brands")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(brands);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await connectDB();
    const body = await req.json();
    body.slug = slugify(body.slug || body.name);
    const now = new Date();
    const toInsert = { ...body, createdAt: now, updatedAt: now };
    const result = await db.collection("brands").insertOne(toInsert);
    return NextResponse.json({ ...toInsert, _id: result.insertedId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
