import { MpesaTransaction } from "@/models/MpesaTransaction";
import { NextRequest, NextResponse } from "next/server";

/**
 * Types for the callback payload that Safaricom POSTs to us
 * after an STK push transaction completes (success or failure).
 */
type CallbackMetadataItem = {
  Name: string;
  Value?: string | number;
};

type StkCallback = {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResultCode?: number;
  ResultDesc?: string;
  CallbackMetadata?: {
    Item: CallbackMetadataItem[];
  };
};

type CallbackPayload = {
  Body?: {
    stkCallback?: StkCallback;
  };
};

/**
 * POST /api/mpesa/callback
 *
 * This is the URL Safaricom hits asynchronously after the customer responds
 * to the STK prompt. We must always reply with `{ ResultCode: 0 }` so that
 * Safaricom stops retrying, regardless of whether the payment succeeded.
 *
 * The response body contains either a success (ResultCode 0) or a
 * failure/cancel (any other ResultCode) inside `stkCallback`.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. First, respond to Safaricom immediately so it stops retrying.
  //    We do this right away (before any heavy processing) to be safe.
  const ack = NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" }, { status: 200 });

  try {
    // 2. Read the full request body as text so we can log the raw payload.
    const rawBody = await req.text();
    console.log("M-Pesa callback raw body:", rawBody);

    // 3. Parse it into a structured object.
    const callback = (JSON.parse(rawBody) as CallbackPayload)?.Body?.stkCallback;
    if (!callback) {
      console.warn("M-Pesa callback received but no stkCallback found, ignoring.");
      return ack; // still ack so Safaricom stops retrying
    }

    const { ResultCode, ResultDesc, CallbackMetadata, CheckoutRequestID, MerchantRequestID } =
      callback;

    // 4. If the callback doesn't carry the CheckoutRequestID, there is no way
    //    to match it to a stored transaction — log and still ack.
    if (!CheckoutRequestID) {
      console.warn("Callback received without CheckoutRequestID, cannot update transaction.");
      return ack;
    }

    // 5. Determine whether the payment succeeded.
    //    ResultCode 0 means the payment was completed successfully.
    if (ResultCode === 0) {
      console.log("Payment successful.");

      // 6. Pull the interesting fields out of CallbackMetadata.Item
      //    (Amount, MpesaReceiptNumber, TransactionDate, PhoneNumber).
      const metadata: Record<string, string | number | undefined> = {};
      for (const item of CallbackMetadata?.Item ?? []) {
        metadata[item.Name] = item.Value;
      }

      console.log("Payment details:", {
        CheckoutRequestID,
        MerchantRequestID,
        Amount: metadata.Amount,
        MpesaReceiptNumber: metadata.MpesaReceiptNumber,
        TransactionDate: metadata.TransactionDate,
        PhoneNumber: metadata.PhoneNumber,
      });

      // 7. Find the pending MpesaTransaction we created in the stkpush route
      //    (by CheckoutRequestID) and mark it as "success", persisting the
      //    callback metadata that the frontend / receipt needs.
      //    Build the update object conditionally so we never write fields that
      //    the callback didn't actually provide.
      const successUpdate: Record<string, unknown> = {
        status: "success",
        resultCode: 0,
        resultDesc: ResultDesc ?? null,
        mpesaReceiptNumber: (metadata.MpesaReceiptNumber as string) ?? null,
        transactionDate:
          metadata.TransactionDate !== undefined ? String(metadata.TransactionDate) : null,
        merchantRequestId: MerchantRequestID ?? undefined,
      };
      // Only set the amount / phone from the callback if Daraja actually sent them.
      if (metadata.Amount !== undefined) {
        successUpdate.amount = Number(metadata.Amount);
      }
      if (metadata.PhoneNumber !== undefined) {
        successUpdate.phoneNumber = String(metadata.PhoneNumber);
      }

      try {
        await MpesaTransaction.findOneAndUpdateByCheckoutRequestId(
          CheckoutRequestID,
          successUpdate
        );
        console.log(`Updated MpesaTransaction (${CheckoutRequestID}) to success.`);
      } catch (dbError) {
        // Log but DO NOT fail the ack — Safaricom must stop retrying.
        console.error("Failed to update MpesaTransaction to success:", dbError);
      }
    } else {
      // 8. Any other ResultCode means it was cancelled or failed.
      //    Record the transaction as "failed" with the result code/description.
      console.log(`Payment not successful. ResultCode=${ResultCode}, ResultDesc=${ResultDesc}`);

      try {
        await MpesaTransaction.findOneAndUpdateByCheckoutRequestId(CheckoutRequestID, {
          status: "failed",
          resultCode: ResultCode ?? null,
          resultDesc: ResultDesc ?? null,
          merchantRequestId: MerchantRequestID ?? undefined,
        });
        console.log(`Updated MpesaTransaction (${CheckoutRequestID}) to failed.`);
      } catch (dbError) {
        // Again, log but don't fail the ack.
        console.error("Failed to update MpesaTransaction to failed:", dbError);
      }
    }
  } catch (error) {
    // If anything goes wrong while inspecting the callback, log it but
    // STILL send the success ack so Safaricom doesn't retry endlessly.
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing M-Pesa callback:", message);
  }

  return ack;
}

