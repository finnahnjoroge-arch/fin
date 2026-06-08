import { connectDB } from "@/lib/mongodb";

export async function getSettingsCollection() {
  const db = await connectDB();
  return db.collection("settings");
}

export const Settings = {
  async findOne(filter: any) {
    const col = await getSettingsCollection();
    return col.findOne(filter);
  },
  async findOneAndUpdate(filter: any, update: any, options: any = {}) {
    const col = await getSettingsCollection();
    return col.findOneAndUpdate(filter, update, { returnDocument: "after", ...options });
  },
  async create(doc: any) {
    const col = await getSettingsCollection();
    const now = new Date();
    const toInsert = { ...doc, createdAt: now, updatedAt: now };
    const result = await col.insertOne(toInsert);
    return { ...toInsert, _id: result.insertedId };
  },
};
