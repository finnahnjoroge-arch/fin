import { handlers } from "@/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

async function safeHandler(
  handler: (req: NextRequest) => Promise<Response>,
  req: NextRequest,
) {
  try {
    return await handler(req);
  } catch (error) {
    console.error("[auth] handler error:", error);
    return NextResponse.json(
      { error: "Authentication handler failed", detail: String(error) },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return safeHandler(handlers.GET, req);
}

export async function POST(req: NextRequest) {
  return safeHandler(handlers.POST, req);
}
