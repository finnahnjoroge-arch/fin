import { Db, MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB_NAME || "test";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export async function connectDB(): Promise<Db> {
  if (!MONGODB_URI) throw new Error("MONGODB_URI not defined");
  if (!client) {
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });
    clientPromise = client.connect();
  }
  if (clientPromise) {
    await clientPromise;
  }
  return client!.db(MONGODB_DB);
}

export async function disconnectDB() {
  if (client) {
    await client.close();
    client = null;
  }
}
