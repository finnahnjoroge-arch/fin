import { Db, MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB_NAME || "test";

if (!MONGODB_URI) throw new Error("MONGODB_URI not defined in environment variables");

const options = {
  maxPoolSize: 5,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (!global._mongoClientPromise) {
  const client = new MongoClient(MONGODB_URI, options);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export async function connectDB(): Promise<Db> {
  const client = await clientPromise;
  return client.db(MONGODB_DB);
}

