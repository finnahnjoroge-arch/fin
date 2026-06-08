import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";

export async function getCategoryCollection() {
  const db = await connectDB();
  return db.collection("categories");
}

export const Category = {
  async find(filter = {}) {
    const col = await getCategoryCollection();
    return col.find(filter);
  },
  async findOne(filter: any) {
    const col = await getCategoryCollection();
    return col.findOne(filter);
  },
  async findById(id: string) {
    const col = await getCategoryCollection();
    return col.findOne({ _id: new ObjectId(id) });
  },
  async findByIdAndUpdate(id: string, update: any, options: any = {}) {
    const col = await getCategoryCollection();
    return col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: "after", ...options }
    );
  },
  async findByIdAndDelete(id: string) {
    const col = await getCategoryCollection();
    return col.deleteOne({ _id: new ObjectId(id) });
  },
  async create(doc: any) {
    const col = await getCategoryCollection();
    const now = new Date();
    const toInsert = { ...doc, createdAt: now, updatedAt: now };
    const result = await col.insertOne(toInsert);
    return { ...toInsert, _id: result.insertedId };
  },
  async countDocuments(filter = {}) {
    const col = await getCategoryCollection();
    return col.countDocuments(filter);
  },
};
