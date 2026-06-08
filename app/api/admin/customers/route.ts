import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const db = await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");

    const match: any = {};
    if (search) {
      match.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "customer",
          as: "orders",
        },
      },
      {
        $addFields: {
          orderCount: { $size: "$orders" },
          totalSpent: {
            $round: [{ $sum: { $map: { input: "$orders", as: "o", in: { $ifNull: ["$$o.total", 0] } } } }, 2],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { _id: 1, name: 1, email: 1, phone: 1, createdAt: 1, orderCount: 1, totalSpent: 1 } },
    ];

    const [customers, countResult] = await Promise.all([
      db.collection("customers").aggregate(pipeline).toArray(),
      db.collection("customers").countDocuments(match),
    ]);

    return NextResponse.json({
      customers,
      total: countResult,
      page,
      totalPages: Math.ceil(countResult / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    const db = await connectDB();
    const objectIds = ids
      .filter((id) => typeof id === "string" && id.length === 24)
      .map((id) => new ObjectId(id));

    if (objectIds.length === 0) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    const result = await db
      .collection("customers")
      .deleteMany({ _id: { $in: objectIds } });

    return NextResponse.json({ deleted: result.deletedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
