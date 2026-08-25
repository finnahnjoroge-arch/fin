import { MpesaTransaction } from "@/models/MpesaTransaction";
import { NextRequest, NextResponse } from "next/server";

// How long (ms) a transaction may stay "pending" before we consider it timed out.
// 90 seconds covers the usual Daraja callback window; if no callback arrived
// by then (e.g. Daraja retried and gave up, or our callback URL was unreachable),
// we treat the transaction as "timeout" even though nothing in the DB changed.
const PENDING_TIMEOUT_MS = 90 * 1000;

/**
 * GET /api/mpesa/status/[checkoutRequestId]
 *
 * Returns the live status of a single M-Pesa transaction.
 * Used by the frontend to poll while waiting for the customer to pay.
 *
 * Response shapes:
 *   success -> { status: "success", resultDesc, mpesaReceiptNumber }
 *   failed  -> { status: "failed", resultDesc, resultCode }
 *   timeout -> { status: "timeout", resultDesc: "..." }
 *   pending -> { status: "pending", resultDesc: "..." }
 *   404     -> { error: "..." } (no such transaction)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ checkoutRequestId: string }> }
): Promise<NextResponse> {
  try {
    const { checkoutRequestId } = await params;

    // 1. Look up the transaction by the ID Daraja assigned at push time.
    const tx = await MpesaTransaction.findByCheckoutRequestId(checkoutRequestId);

    // If there is no record, the frontend is asking for something we never
    // created (e.g. a typo in the ID or a transaction that predates this code).
    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // 2. Compute the effective status.
    //    - If the record already reached a final state (success/failed), use it.
    //    - If it's still "pending", check the timeout safeguard: if it has been
    //      more than PENDING_TIMEOUT_MS since createdAt and no callback updated
    //      it, we treat it as timed out — WITHOUT mutating the DB record.
    const createdTime = new Date(tx.createdAt).getTime();
    const elapsedMs = Date.now() - createdTime;

    let effectiveStatus = tx.status;
    if (tx.status === "pending" && elapsedMs > PENDING_TIMEOUT_MS) {
      effectiveStatus = "timeout";
    }

    // 3. Build the response the frontend cares about.
    const result: Record<string, unknown> = {
      status: effectiveStatus,
      resultDesc: tx.resultDesc ?? null,
    };

    // Only include the receipt if we actually have one (i.e. payment succeeded).
    if (tx.mpesaReceiptNumber) {
      result.mpesaReceiptNumber = tx.mpesaReceiptNumber;
    }

    // Optionally include the raw result code when it's set.
    if (tx.resultCode !== undefined && tx.resultCode !== null) {
      result.resultCode = tx.resultCode;
    }

    // If we're reporting a timeout, give the frontend a friendly message.
    if (effectiveStatus === "timeout") {
      result.resultDesc =
        tx.resultDesc ?? "Payment timed out. No response was received within the allowed window.";
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Mpesa status route error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
