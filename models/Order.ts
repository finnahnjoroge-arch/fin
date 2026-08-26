import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function getOrderCollection() {
  const db = await connectDB();
  return db.collection("orders");
}

export const Order = {
  async find(filter = {}) {
    const col = await getOrderCollection();
    return col.find(filter);
  },
  async findById(id: string) {
    const col = await getOrderCollection();
    return col.findOne({ _id: new ObjectId(id) });
  },
  async findByIdAndUpdate(id: string, update: any, options: any = {}) {
    const col = await getOrderCollection();
    return col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      update,
      { returnDocument: "after", ...options }
    );
  },
  // Look up an order by the M-Pesa checkoutRequestId returned by Daraja.
  // Used by the M-Pesa callback to flip the linked Order to "paid"/"failed".
  async findByMpesaCheckoutRequestId(checkoutRequestId: string) {
    const col = await getOrderCollection();
    return col.findOne({ mpesaCheckoutRequestId: checkoutRequestId });
  },
  // Update ONLY the paymentStatus field on an order (no other order fields
  // are touched) so the M-Pesa callback can keep the order in sync without
  // risking overwriting anything the customer/admin may have changed.
  async updatePaymentStatus(id: string, paymentStatus: string) {
    const col = await getOrderCollection();
    return col.updateOne(
      { _id: new ObjectId(id) },
      { $set: { paymentStatus, updatedAt: new Date() } }
    );
  },
  async create(doc: any) {
    const col = await getOrderCollection();
    const now = new Date();
    // Default payment lifecycle fields when the caller doesn't supply them.
    // - paymentStatus: "pending" | "paid" | "failed"
    // - mpesaCheckoutRequestId: links this order to its M-Pesa transaction.
    const toInsert = {
      paymentStatus: "pending",
      mpesaCheckoutRequestId: null,
      ...doc,
      createdAt: now,
      updatedAt: now,
    };
    const result = await col.insertOne(toInsert);
    return { ...toInsert, _id: result.insertedId };
  },
  async countDocuments(filter = {}) {
    const col = await getOrderCollection();
    return col.countDocuments(filter);
  },
};

