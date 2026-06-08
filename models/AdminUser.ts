import { connectDB } from "@/lib/mongodb";

export async function getAdminUserCollection() {
  const db = await connectDB();
  return db.collection("adminusers");
}

export const AdminUser = {
  async findOne(filter: any = {}) {
    const col = await getAdminUserCollection();
    return col.findOne(filter);
  },
  async findOneAndUpdate(filter: any, update: any, options: any = {}) {
    const col = await getAdminUserCollection();
    return col.findOneAndUpdate(filter, update, { returnDocument: "after", ...options });
  },
};
