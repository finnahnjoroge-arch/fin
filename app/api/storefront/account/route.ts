import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone is required" },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Build query - look for customer by email or phone
    const query: any = {};
    if (email) {
      query.email = email.toLowerCase().trim();
    }
    if (phone) {
      // Normalize phone number for matching
      const normalizedPhone = phone.replace(/[\s\-()]/g, "");
      query.phone = { $regex: normalizedPhone.slice(-9), $options: "i" };
    }

    // Find customer
    let customer = await db.collection("customers").findOne(
      email && phone
        ? { $or: [{ email: query.email }, { phone: query.phone }] }
        : email
        ? { email: query.email }
        : { phone: query.phone }
    );

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Get customer's orders
    const orders = await db
      .collection("orders")
      .find({ customer: customer._id })
      .sort({ createdAt: -1 })
      .toArray();

    // Format response
    const formattedOrders = orders.map((order) => ({
      _id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: order.total,
      items: order.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.image || "",
      })),
      createdAt: order.createdAt,
      shippingAddress: order.shippingAddress,
    }));

    return NextResponse.json({
      customer: {
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        createdAt: customer.createdAt,
      },
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Account API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch account data" },
      { status: 500 }
    );
  }
}
