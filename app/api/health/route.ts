import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  try {
    await connectDB();
    return NextResponse.json({ status: "ok", timestamp: new Date() }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database connection error";
    return NextResponse.json({ status: "error", message }, { status: 503 });
  }
}
