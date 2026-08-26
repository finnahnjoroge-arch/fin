import { initiateStkPush, normalizePhoneNumber } from "@/lib/mpesa";
import { MpesaTransaction } from "@/models/MpesaTransaction";
import { NextRequest, NextResponse } from "next/server";

/**
 * Request body expected by this route:
 *  - phoneNumber      : customer's phone, e.g. "254712345678" (or "0712345678")
 *  - amount           : amount to charge in KES
 *  - accountReference : e.g. an order number, shown on the STK prompt
 *  - description      : free-form description of the transaction
 */
type StkPushRequest = {
  phoneNumber: string;
  amount: string | number;
  accountReference: string;
  description?: string;
};

/**
 * POST /api/mpesa/stkpush
 *
 * Initiates an STK push to the customer's phone. Returns the Daraja response
 * which will contain `CheckoutRequestID` and `MerchantRequestID` on success.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Parse & validate the incoming request body.
    const body = (await req.json()) as Partial<StkPushRequest>;
    const { phoneNumber, amount, accountReference, description } = body;

    if (!phoneNumber || !amount || !accountReference) {
      return NextResponse.json(
        { error: "Missing required fields: phoneNumber, amount, accountReference" },
        { status: 400 }
      );
    }

    // 2. Send the STK push to Daraja by reusing the shared helper from
    //    lib/mpesa.ts. This keeps the token/password/timestamp/payload logic
    //    in ONE place — shared with the real checkout flow — so it is not
    //    duplicated here.
    const json = await initiateStkPush({
      phoneNumber,
      amount,
      accountReference,
      description,
    });

    // 3. Distinguish a genuine Daraja acknowledgement (ResponseCode "0")
    //    from other outcomes (e.g. rate-limiting, invalid params) where no
    //    callback will ever arrive and there is nothing worth tracking.
    const responseCode = json.ResponseCode;
    const checkoutRequestId = json.CheckoutRequestID as string | undefined;
    const merchantRequestId = json.MerchantRequestID as string | undefined;

    if (responseCode !== "0" || !checkoutRequestId) {
      // Daraja did NOT accept the request. Return the full response so the
      // client can inspect it, but skip creating a transaction record.
      console.warn("STK push not acknowledged by Daraja:", json);
      return NextResponse.json(json, { status: 200 });
    }

    // 4. Daraja acknowledged the push. Persist a "pending" MpesaTransaction
    //    right now so that:
    //      - the test page can poll GET /api/mpesa/status/[id] for progress, and
    //      - the callback route can match this record by CheckoutRequestID.
    //    (This is the STANDALONE sandbox path. The real checkout flow persists
    //    its own transaction with an orderId link in the orders route.)
    try {
      await MpesaTransaction.create({
        checkoutRequestId,
        merchantRequestId,
        phoneNumber: normalizePhoneNumber(phoneNumber), // -> "2547XXXXXXXX"
        amount: Number(amount),
        accountReference,
      });
      console.log(
        `Persisted pending MpesaTransaction for CheckoutRequestID=${checkoutRequestId}`
      );
    } catch (dbError) {
      // If persisting fails we do NOT crash the whole request — the push was
      // already sent and the customer may still pay. Log it and continue so
      // the frontend still gets the IDs back.
      console.error("Failed to persist MpesaTransaction:", dbError);
    }

    // 5. Return the Daraja response to the frontend, and include the
    //    checkoutRequestId at the top level so the test page knows what to poll.
    return NextResponse.json({ ...json, checkoutRequestId }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("STK push route error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

