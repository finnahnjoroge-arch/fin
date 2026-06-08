import { connectDB } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await connectDB();
    const user = await db.collection("adminusers").findOne({}, { projection: { name: 1, email: 1 } });
    if (!user) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }
    return NextResponse.json({ name: user.name || "", email: user.email || "" });
  } catch (error) {
    console.error("Account GET error:", error);
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = await connectDB();
    const { name, email, currentPassword, newPassword } = await req.json();

    const user = await db.collection("adminusers").findOne({});
    if (!user) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    const update: Record<string, unknown> = {};

    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 });
      }
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      update.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await db.collection("adminusers").updateOne({ _id: user._id }, { $set: update });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account PUT error:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}
