import { MpesaTransaction } from "@/models/MpesaTransaction";
import { Order } from "@/models/Order";
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
 * Update the linked Order's paymentStatus without touching any other Order
 * fields. The transaction may have an `orderId` (real-checkout link). We also
 * fall back to matching an Order by its `mpesaCheckoutRequestId`, so callbacks
 * from the standalone sandbox /mpesa-test page work too (those transactions
 * have no orderId, but their Order, if any, can still be found by the ID).
 *
 * Errors here are swallowed deliberately — the callback MUST still ack Ok so
 * Safaricom stops retrying, even if our own DB bookkeeping fails.
 *
 * @param tx - the updated MpesaTransaction document (may carry orderId).
 * @param checkoutRequestId - the current callback's CheckoutRequestID.
 * @param paymentStatus - "paid" | "failed" to set on the linked Order.
 */
async function syncOrderPaymentStatus(
  tx: any,
  checkoutRequestId: string,
  paymentStatus: string
): Promise<void> {
  try {
    // Resolve the target Order id: prefer the transaction's orderId link,
    // otherwise search by mpesaCheckoutRequestId.
    let orderId: string | null = tx?.orderId ?? null;
    if (!orderId) {
      const orderByRef = await Order.findByMpesaCheckoutRequestId(checkoutRequestId);
      orderId = orderByRef?._id?.toString() ?? null;
    }

    if (!orderId) {
      // No linked Order (e.g. a pure /mpesa-test transaction with no order).
      return;
    }

    await Order.updatePaymentStatus(orderId, paymentStatus);
    console.log(
      `Updated Order (${orderId}) paymentStatus to "${paymentStatus}" via CheckoutRequestID=${checkoutRequestId}`
    );
  } catch (orderError) {
    console.error("Failed to sync Order paymentStatus from M-Pesa callback:", orderError);
  }
}

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

      // The transaction update returns the full document (including orderId),
      // which we use to find and flip the linked Order to "paid".
      let updatedTx: any = null;
      try {
        updatedTx = await MpesaTransaction.findOneAndUpdateByCheckoutRequestId(
          CheckoutRequestID,
          successUpdate
        );
        console.log(`Updated MpesaTransaction (${CheckoutRequestID}) to success.`);
      } catch (dbError) {
        // Log but DO NOT fail the ack — Safaricom must stop retrying.
        console.error("Failed to update MpesaTransaction to success:", dbError);
      }

      // 7b. Payment succeeded -> update the linked Order's paymentStatus to "paid".
      //      We look the Order up using the orderId stored on the transaction (the
      //      real-checkout link), falling back to matching by mpesaCheckoutRequestId.
      await syncOrderPaymentStatus(updatedTx, CheckoutRequestID, "paid");
    } else {
      // 8. Any other ResultCode means it was cancelled or failed.
      //    Record the transaction as "failed" with the result code/description.
      console.log(`Payment not successful. ResultCode=${ResultCode}, ResultDesc=${ResultDesc}`);

      // The transaction update returns the full document (including orderId).
      let updatedTxFailure: any = null;
      try {
        updatedTxFailure = await MpesaTransaction.findOneAndUpdateByCheckoutRequestId(
          CheckoutRequestID,
          {
            status: "failed",
            resultCode: ResultCode ?? null,
            resultDesc: ResultDesc ?? null,
            merchantRequestId: MerchantRequestID ?? undefined,
          }
        );
        console.log(`Updated MpesaTransaction (${CheckoutRequestID}) to failed.`);
      } catch (dbError) {
        // Again, log but don't fail the ack.
        console.error("Failed to update MpesaTransaction to failed:", dbError);
      }

      // 8b. Payment failed -> update the linked Order's paymentStatus to "failed".
      await syncOrderPaymentStatus(updatedTxFailure, CheckoutRequestID, "failed");
    }
  } catch (error) {
    // If anything goes wrong while inspecting the callback, log it but
    // STILL send the success ack so Safaricom doesn't retry endlessly.
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing M-Pesa callback:", message);
  }

  return ack;
}

