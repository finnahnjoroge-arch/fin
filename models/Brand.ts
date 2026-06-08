import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";

export async function getBrandCollection() {
  const db = await connectDB();
  return db.collection("brands");
}

export const Brand = {
  async find(filter = {}) {
    const col = await getBrandCollection();
    return col.find(filter).sort({ createdAt: -1 });
  },
  async findOne(filter: any) {
    const col = await getBrandCollection();
    return col.findOne(filter);
  },
  async findById(id: string) {
    const col = await getBrandCollection();
    return col.findOne({ _id: new ObjectId(id) });
  },
  async findByIdAndUpdate(id: string, update: any, options: any = {}) {
    const col = await getBrandCollection();
    return col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after", ...options }
    );
  },
  async findByIdAndDelete(id: string) {
    const col = await getBrandCollection();
    return col.deleteOne({ _id: new ObjectId(id) });
  },
  async create(doc: any) {
    const col = await getBrandCollection();
    const now = new Date();
    const toInsert = { ...doc, createdAt: now, updatedAt: now };
    const result = await col.insertOne(toInsert);
    return { ...toInsert, _id: result.insertedId };
  },
  async countDocuments(filter = {}) {
    const col = await getBrandCollection();
    return col.countDocuments(filter);
  },
};
