import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const handlesParam = searchParams.get("handles");

    if (!handlesParam) {
      return NextResponse.json({ products: [] });
    }

    const handles = handlesParam
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);

    if (handles.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const db = await connectDB();
    const rawProducts = await db
      .collection("products")
      .find({ slug: { $in: handles } })
      .toArray();

    // Map DB products to the format the frontend expects
    const products = rawProducts.map((p) => ({
      id: p._id.toString(),
      handle: p.slug,
      title: p.name || p.title || "",
      description:
        p.description || p.shortDescription || "",
      featuredImage: p.image
        ? { url: p.image, altText: p.name || "" }
        : p.images && p.images.length > 0
        ? { url: p.images[0], altText: p.name || "" }
        : undefined,
      priceRange: {
        minVariantPrice: {
          amount: String(p.price || 0),
          currencyCode: p.currency || "KES",
        },
        maxVariantPrice: {
          amount: String(
            p.comparePrice || p.price || 0
          ),
          currencyCode: p.currency || "KES",
        },
      },
      currencyCode: p.currency || "KES",
      comparePrice: p.comparePrice
        ? { amount: String(p.comparePrice), currencyCode: p.currency || "KES" }
        : undefined,
      availableForSale: p.stock === undefined ? true : p.stock > 0,
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Wishlist API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist products" },
      { status: 500 }
    );
  }
}
