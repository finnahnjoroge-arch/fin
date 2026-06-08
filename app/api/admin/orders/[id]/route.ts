import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

async function populateOrder(db: any, order: any) {
  if (!order) return null;
  if (order.customer) {
    const customer = await db.collection("customers").findOne(
      { _id: new ObjectId(order.customer.toString()) },
      { projection: { name: 1, email: 1, phone: 1 } }
    );
    order.customer = customer || order.customer;
  }
  if (order.items?.length) {
    const productIds = order.items.map((i: any) => new ObjectId(i.product.toString()));
    const products = await db.collection("products")
      .find({ _id: { $in: productIds } }, { projection: { name: 1, slug: 1, images: 1 } })
      .toArray();
    const productMap = Object.fromEntries(products.map((p: any) => [p._id.toString(), p]));
    order.items = order.items.map((i: any) => ({
      ...i,
      product: productMap[i.product.toString()] || i.product,
    }));
  }
  return order;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectDB();
    const { id } = await params;
    const order = await db.collection("orders").findOne({ _id: new ObjectId(id) });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(await populateOrder(db, order));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectDB();
    const { id } = await params;
    const body = await req.json();
    const update: any = { $set: {} };

    if (body.status) {
      update.$set.status = body.status;
      update.$push = {
        statusHistory: {
          status: body.status,
          note: body.note || `Status changed to ${body.status}`,
          changedAt: new Date(),
        },
      };
    }
    if (body.paymentStatus) update.$set.paymentStatus = body.paymentStatus;
    if (body.adminNotes !== undefined) update.$set.adminNotes = body.adminNotes;

    const order = await db.collection("orders").findOneAndUpdate(
      { _id: new ObjectId(id) },
      update,
      { returnDocument: "after" }
    );
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const populatedOrder = await populateOrder(db, order);

        // If the status was changed to "cancelled", send a cancellation email
    if (body.status === "cancelled" && populatedOrder.customer?.email && !populatedOrder.customer.email.includes("placeholder.local")) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/send-order-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerEmail: populatedOrder.customer.email,
            customerName: populatedOrder.customer.name,
            orderId: populatedOrder._id.toString(),
            total: populatedOrder.total,
            cancelled: true,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send cancellation email:", emailError);
      }
    }

    // If the status was changed to "shipped", send a shipped notification email
    if (body.status === "shipped" && populatedOrder.customer?.email && !populatedOrder.customer.email.includes("placeholder.local")) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/send-order-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerEmail: populatedOrder.customer.email,
            customerName: populatedOrder.customer.name,
            orderId: populatedOrder._id.toString(),
            total: populatedOrder.total,
            shipped: true,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send shipped notification email:", emailError);
      }
    }

    return NextResponse.json(populatedOrder);
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
    const existing = await db.collection("orders").findOne({ _id: new ObjectId(id) });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (permanent || existing.deletedAt) {
      await db.collection("orders").deleteOne({ _id: new ObjectId(id) });
      return NextResponse.json({ success: true, message: "Order permanently deleted" });
    }

    await db.collection("orders").updateOne(
      { _id: new ObjectId(id) },
      { $set: { deletedAt: new Date(), updatedAt: new Date() } }
    );
    return NextResponse.json({ success: true, message: "Order moved to trash" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
