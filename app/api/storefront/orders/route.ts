import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

// ===== Spam/abuse protections =====

// 1) Common spam name blacklist (compared case-insensitively after trimming)
const SPAM_NAMES = new Set([
  "john smith",
  "test user",
  "john doe",
  "john smith 002",
  "jane doe",
  "test test",
]);

// 1b) Known disposable/bot email domain blacklist (compared case-insensitively)
const SPAM_EMAIL_DOMAINS = new Set([
  "storebotmail.joonix.net",
  "mailinator.com",
  "tempmail.com",
  "guerrillamail.com",
]);

// 2) Kenyan phone validation: must start with 07, 01, or +254 (then 8 digits)
const KENYAN_PHONE_RE = /^(\+?254|0)([17])\d{8}$/;

// 3) In-memory rate limiter: max 3 orders per hour per IP.
//    NOTE: In-memory state is per-process/isolate. On Cloudflare Workers this
//    is not globally shared across all instances; swap for Redis for a
//    hard guarantee. Provides a reasonable basic protection layer.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3; // max 3 orders per hour per IP
const orderTimestamps = new Map<string, number[]>(); // IP -> timestamps

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  // Prune entries outside the window
  const timestamps = (orderTimestamps.get(ip) || []).filter((t) => t > cutoff);
  orderTimestamps.set(ip, timestamps);
  return timestamps.length >= RATE_LIMIT_MAX;
}

// Record a successfully created order for rate-limiting purposes
function recordOrder(ip: string): void {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (orderTimestamps.get(ip) || []).filter((t) => t > cutoff);
  timestamps.push(now);
  orderTimestamps.set(ip, timestamps);
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    const db = await connectDB();
    const body = await req.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }
    if (!body.shippingAddress?.fullName || !body.shippingAddress?.phone) {
      return NextResponse.json({ error: "Full name and phone number are required" }, { status: 400 });
    }
    if (body.total === undefined || body.subtotal === undefined) {
      return NextResponse.json({ error: "Total and subtotal are required" }, { status: 400 });
    }

    const { fullName, phone, email, address, city, region, country, notes } = body.shippingAddress;

    // ---- 1) Spam name blacklist ----
    if (SPAM_NAMES.has(String(fullName).trim().toLowerCase())) {
      return NextResponse.json(
        { error: "The provided name is not accepted. Please use a valid name." },
        { status: 400 }
      );
    }

        // ---- 2) Kenyan phone validation ----
        const normalizedPhone = String(phone || "").replace(/[\s\-()]/g, "");
        if (!KENYAN_PHONE_RE.test(normalizedPhone)) {
          return NextResponse.json(
            {
              error:
                "Invalid phone number. Please enter a valid Kenyan number (e.g. 07XXXXXXXX, 01XXXXXXXX, or +2547XXXXXXXX).",
            },
            { status: 400 }
          );
        }

        // ---- 2b) Bot email domain blacklist ----
        if (email) {
          const emailDomain = String(email).split("@").pop()?.trim().toLowerCase() || "";
          if (SPAM_EMAIL_DOMAINS.has(emailDomain)) {
            return NextResponse.json(
              { error: "The provided email address is not accepted." },
              { status: 400 }
            );
          }
        }

        // ---- 2c) Non-Kenyan address block ----
        if (country) {
          const normalizedCountry = String(country).trim();
          if (normalizedCountry !== "Kenya" && normalizedCountry !== "KE") {
            return NextResponse.json(
              { error: "Orders are only accepted within Kenya." },
              { status: 400 }
            );
          }
        }

        // ---- 3) Rate limit by IP ----
    // Check the limit before creating the order, but only record the order
    // after it is successfully persisted (see below).
    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: "Too many orders. Please try again later." },
        { status: 429 }
      );
    }

    const customerEmail = email || (phone ? `${phone}@placeholder.local` : `guest-${Date.now()}@placeholder.local`);

    let customer = await db.collection("customers").findOne({ $or: [{ email: customerEmail }, { phone }] });
    if (customer && email && customer.email !== email) {
      await db.collection("customers").updateOne({ _id: customer._id }, { $set: { email: email } });
      customer.email = email;
    }
    if (!customer) {
      const now = new Date();
      const result = await db.collection("customers").insertOne({
        email: customerEmail, name: fullName, phone: phone || "", createdAt: now, updatedAt: now,
      });
      customer = { _id: result.insertedId, email: customerEmail, name: fullName, phone: phone || "" };
    }

    for (const item of body.items) {
      if (!item.productId || !item.quantity) continue;
      if (!ObjectId.isValid(item.productId)) continue;
      if (item.variantId && ObjectId.isValid(item.variantId)) {
        await db.collection("products").updateOne(
          { _id: new ObjectId(item.productId), "variants._id": new ObjectId(item.variantId) },
          { $inc: { "variants.$.stock": -item.quantity } }
        );
      } else {
        await db.collection("products").updateOne(
          { _id: new ObjectId(item.productId) },
          { $inc: { stock: -item.quantity } }
        );
      }
    }

    const now = new Date();
    const orderNumber = "ORD-" + Date.now();
    const orderData = {
      orderNumber,
      customer: customer._id,
      status: "pending",
      paymentMethod: "cash_on_delivery",
      paymentStatus: "unpaid",
      items: body.items.map((item: any) => ({
        product: ObjectId.isValid(item.productId) ? new ObjectId(item.productId) : item.productId,
        variantId: item.variantId && ObjectId.isValid(item.variantId) ? new ObjectId(item.variantId) : item.variantId || null,
        name: item.name,
        sku: item.sku || "",
        image: item.image || "",
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: body.subtotal,
      shippingCost: body.shippingCost || 0,
            total: body.total,
      shippingAddress: { fullName, phone: phone || "", address, city, region, country, notes: notes || "" },
      adminNotes: "",
      statusHistory: [{ status: "pending", note: "Order placed", changedAt: now }],
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("orders").insertOne(orderData);

    // Record the successful order for rate limiting
    recordOrder(clientIp);

    try {
      await fetch(new URL("/api/send-order-email", req.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail,
          customerName: fullName,
          orderId: orderNumber,
          items: orderData.items,
          total: orderData.total,
          phone: phone || "",
          address: `${address}, ${city}, ${country}`, notes: notes || "",
          productUrl: body.items?.[0]?.productId ? `https://finnorah.co.ke/product/${body.items[0].handle || ""}` : "",
        }),
      });
    } catch (emailError) {
      console.error("Order email error:", emailError);
    }

    return NextResponse.json({ orderId: result.insertedId.toString(), orderNumber });
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
