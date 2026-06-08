import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";

export async function getProductCollection() {
  const db = await connectDB();
  return db.collection("products");
}

export const Product = {
  async find(filter = {}) {
    const col = await getProductCollection();
    return col.find(filter);
  },
  async findOne(filter: any) {
    const col = await getProductCollection();
    return col.findOne(filter);
  },
  async findById(id: string) {
    const col = await getProductCollection();
    return col.findOne({ _id: new ObjectId(id) });
  },
  async findByIdAndUpdate(id: string, update: any, options: any = {}) {
    const col = await getProductCollection();
    return col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      update,
      { returnDocument: "after", ...options }
    );
  },
  async findOneAndUpdate(filter: any, update: any, options: any = {}) {
    const col = await getProductCollection();
    return col.findOneAndUpdate(filter, update, { returnDocument: "after", ...options });
  },
  async create(doc: any) {
    const col = await getProductCollection();
    const now = new Date();
    const toInsert = { ...doc, createdAt: now, updatedAt: now };
    const result = await col.insertOne(toInsert);
    return { ...toInsert, _id: result.insertedId };
  },
  async countDocuments(filter = {}) {
    const col = await getProductCollection();
    return col.countDocuments(filter);
  },
  async aggregate(pipeline: any[]) {
    const col = await getProductCollection();
    return col.aggregate(pipeline).toArray();
  },
};
