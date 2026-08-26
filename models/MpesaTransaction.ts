import { connectDB } from "@/lib/mongodb";

/**
 * Helper to get the MpesaTransaction collection.
 * Follows the exact same pattern used by other models in this codebase
 * (e.g. models/Order.ts, models/Customer.ts) — we connect via the shared
 * connectDB() helper and return the specific collection.
 */
export async function getMpesaTransactionCollection() {
  const db = await connectDB();
  return db.collection("mpesatransactions");
}

/**
 * MpesaTransaction data-access object.
 *
 * This is a "collection-based" style model (matching the rest of the
 * codebase) rather than a full Mongoose schema. We mirror the fields
 * requested but persist them into the "mpesatransactions" collection.
 *
 * Fields:
 *  - checkoutRequestId   : unique ID returned by Daraja, used as the join key
 *                          between the push request and the callback.
 *  - merchantRequestId   : merchant-side request ID returned by Daraja.
 *  - orderId             : the Mongo ObjectId of the Order this transaction
 *                          belongs to (set when payment is initiated from the
 *                          real checkout flow). Lets the callback locate the
 *                          matching Order to flip it to paid/failed.
 *  - phoneNumber         : the customer's M-Pesa phone number.
 *  - amount              : amount charged (KES).
 *  - accountReference    : e.g. an order number, shown on the STK prompt.
 *  - status              : lifecycle state of the transaction.
 *  - resultCode          : Daraja result code (0 = success). Null while pending.
 *  - resultDesc          : human-readable result description from the callback.
 *  - mpesaReceiptNumber  : M-Pesa receipt number once payment succeeds.
 *  - transactionDate     : date the payment was processed (from callback metadata).
 *  - createdAt / updatedAt : auto-set timestamps (as in other models).
 */
export const MpesaTransaction = {
  /**
   * Create a new transaction document with status "pending".
   * Sets createdAt / updatedAt automatically, matching other models.
   * Any extra field (such as orderId) passed in `doc` is stored as-is.
   */
  async create(doc: any) {
    const col = await getMpesaTransactionCollection();
    const now = new Date();

    // Merge the caller's fields with auto-generated timestamps.
    // Default status is "pending" unless the caller overrides it.
    const toInsert = {
      status: "pending",
      resultCode: null,
      resultDesc: null,
      mpesaReceiptNumber: null,
      transactionDate: null,
      ...doc, // caller's fields win over the defaults above
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(toInsert);
    return { ...toInsert, _id: result.insertedId };
  },

  /**
   * Find a transaction by its checkoutRequestId.
   * Used by the callback route and the status route.
   */
  async findByCheckoutRequestId(checkoutRequestId: string) {
    const col = await getMpesaTransactionCollection();
    return col.findOne({ checkoutRequestId });
  },

  /**
   * Find a transaction by the linked orderId (the Order._id).
   * Useful if you ever need to look up a payment from an order without
   * knowing the checkoutRequestId.
   */
  async findByOrderId(orderId: string) {
    const col = await getMpesaTransactionCollection();
    return col.findOne({ orderId });
  },

  /**
   * Update a transaction that was found by checkoutRequestId.
   * Used by the callback route to move the transaction into its final state
   * (success / failed) and persist the callback metadata.
   * Always bumps updatedAt.
   */
  async findOneAndUpdateByCheckoutRequestId(
    checkoutRequestId: string,
    update: any,
    options: any = {}
  ) {
    const col = await getMpesaTransactionCollection();
    return col.findOneAndUpdate(
      { checkoutRequestId },
      { $set: { ...update, updatedAt: new Date() } },
      { returnDocument: "after", ...options }
    );
  },
};
