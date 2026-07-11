import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

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
