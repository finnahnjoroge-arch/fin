import { NextResponse } from "next/server";
import { getFeedProducts, formatFacebookXml } from "@/lib/feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await getFeedProducts();
  const xml = formatFacebookXml(products);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
