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

export async function GET(req: NextRequest) {
  try {
    const db = await connectDB();
    const { searchParams } = new URL(req.url);
    const hideDeleted = searchParams.get("hideDeleted") === "true";

    const match: any = {};
    if (hideDeleted) match.deletedAt = { $exists: false };

    // Aggregate to populate parent (id + name) and children (id + name) for clarity
    const categories = await db.collection("categories").aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      // lookup parent
      {
        $lookup: {
          from: "categories",
          localField: "parent",
          foreignField: "_id",
          as: "parentDoc",
        }
      },
      { $unwind: { path: "$parentDoc", preserveNullAndEmptyArrays: true } },
      // lookup children
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "parent",
          as: "children",
        }
      },
      {
        $project: {
          name: 1,
          slug: 1,
          description: 1,
          image: 1,
          emoji: 1,
          parent: {
            $cond: [ { $ifNull: ["$parentDoc", false] }, { _id: "$parentDoc._id", name: "$parentDoc.name" }, null ]
          },
          children: { $map: { input: "$children", as: "c", in: { _id: "$$c._id", name: "$$c.name" } } },
          deletedAt: 1,
          createdAt: 1,
          updatedAt: 1,
        }
      }
    ]).toArray();

    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await connectDB();
    const body = await req.json();
    body.slug = slugify(body.slug || body.name);
    // normalize parent to ObjectId or null
    if (body.parent === "none" || body.parent === null || body.parent === undefined || body.parent === "") {
      body.parent = null;
    } else {
      try {
        body.parent = new ObjectId(body.parent);
      } catch (e) {
        body.parent = null;
      }
    }

    const now = new Date();
    const toInsert = { ...body, createdAt: now, updatedAt: now };
    const result = await db.collection("categories").insertOne(toInsert);
    return NextResponse.json({ ...toInsert, _id: result.insertedId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
