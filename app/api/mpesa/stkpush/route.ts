import { formatDarajaTimestamp, generateSTKPassword, getAccessToken, normalizePhoneNumber } from "@/lib/mpesa";
import { MpesaTransaction } from "@/models/MpesaTransaction";
import { NextRequest, NextResponse } from "next/server";

// The endpoint that initiates an M-Pesa STK push prompt on the customer's phone.
const STK_PUSH_URL = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

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

    // 2. Grab required env config.
    const shortCode = process.env.MPESA_SHORTCODE;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;

    if (!shortCode || !callbackUrl) {
      console.error("Missing MPESA_SHORTCODE or MPESA_CALLBACK_URL env vars");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    // 3. Get a fresh access token.
    const accessToken = await getAccessToken();

    // 4. Build the timestamp and password for this specific transaction.
    const timestamp = formatDarajaTimestamp();
    const password = generateSTKPassword();

    // 5. Normalise the customer phone to the Daraja format "2547XXXXXXXX".
    //    Handles "07...", "2547...", "+2547...", and "7..." inputs.
    const partyA = normalizePhoneNumber(phoneNumber);
    // 6. Assemble the payload as documented by Safaricom for CustomerPayBillOnline.
    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: String(amount),
      PartyA: partyA, // payer (customer)
      PartyB: shortCode, // paybill/till number receiving money
      PhoneNumber: partyA, // phone to receive the STK prompt
      CallBackURL: callbackUrl,
      AccountReference: accountReference,
      TransactionDesc: description ?? "Payment",
    };

    console.log("STK Push payload:", payload);

    // 7. Send the STK push request to Daraja.
    const res = await fetch(STK_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    // 8. Capture & log the raw response so we can inspect it while testing.
    const json = (await res.json()) as Record<string, unknown>;
    console.log("Daraja STK push raw response:", json);

    // 9. If the HTTP request to Daraja itself failed, surface the error and
    //    DO NOT create a transaction record — Daraja never acknowledged the push.
    if (!res.ok) {
      return NextResponse.json(
        { error: "STK push request failed", details: json },
        { status: res.status }
      );
    }

    // 10. Distinguish a genuine Daraja acknowledgement (ResponseCode "0")
    //     from other outcomes (e.g. rate-limiting, invalid params) where no
    //     callback will ever arrive and there is nothing worth tracking.
    const responseCode = json.ResponseCode;
    const checkoutRequestId = json.CheckoutRequestID as string | undefined;
    const merchantRequestId = json.MerchantRequestID as string | undefined;

    if (responseCode !== "0" || !checkoutRequestId) {
      // Daraja did NOT accept the request. Return the full response so the
      // client can inspect it, but skip creating a transaction record.
      console.warn("STK push not acknowledged by Daraja:", json);
      return NextResponse.json(json, { status: 200 });
    }

    // 11. Daraja acknowledged the push. Persist a "pending" MpesaTransaction
    //     right now so that:
    //       - the frontend can poll GET /api/mpesa/status/[id] for progress, and
    //       - the callback route can match this record by CheckoutRequestID.
    try {
      await MpesaTransaction.create({
        checkoutRequestId,
        merchantRequestId,
        phoneNumber: partyA,
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

    // 12. Return the Daraja response to the frontend, and include the
    //     checkoutRequestId at the top level so the test page knows what to poll.
    return NextResponse.json({ ...json, checkoutRequestId }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("STK push route error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

