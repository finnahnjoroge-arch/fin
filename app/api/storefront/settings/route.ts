import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await connectDB();
    const settings = await db.collection("settings").findOne({ storeId: "default" });
    const defaults = {
      storeName: "ACME Store",
      currency: "KES",
      country: "Kenya",
      shippingCost: 200,
      freeShippingThreshold: 5000,
      shippingNote: "",
      primaryColor: "#2563eb",
      announcementBar: false,
      announcementText: "",
      logoUrl: "",
      faviconUrl: "",
      metaTitle: "ACME Store",
      metaDescription: "",
    };
    if (!settings) {
      return NextResponse.json(defaults);
    }
    return NextResponse.json({ ...defaults, ...settings });
  } catch (error) {
    console.error("Storefront settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

