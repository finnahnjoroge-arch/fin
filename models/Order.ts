import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";

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
  async create(doc: any) {
    const col = await getOrderCollection();
    const now = new Date();
    const toInsert = { ...doc, createdAt: now, updatedAt: now };
    const result = await col.insertOne(toInsert);
    return { ...toInsert, _id: result.insertedId };
  },
  async countDocuments(filter = {}) {
    const col = await getOrderCollection();
    return col.countDocuments(filter);
  },
};
