import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";

export async function getCustomerCollection() {
  const db = await connectDB();
  return db.collection("customers");
}

export const Customer = {
  async findOne(filter: any) {
    const col = await getCustomerCollection();
    return col.findOne(filter);
  },
  async create(doc: any) {
    const col = await getCustomerCollection();
    const now = new Date();
    const toInsert = { ...doc, createdAt: now, updatedAt: now };
    const result = await col.insertOne(toInsert);
    return { ...toInsert, _id: result.insertedId };
  },
  async countDocuments(filter = {}) {
    const col = await getCustomerCollection();
    return col.countDocuments(filter);
  },
  async aggregate(pipeline: any[]) {
    const col = await getCustomerCollection();
    return col.aggregate(pipeline).toArray();
  },
};
