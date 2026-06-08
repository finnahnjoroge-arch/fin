import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "entry";

async function fixAdmin() {
  if (!uri) {
    console.error("MONGODB_URI not set");
    process.exit(1);
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db = client.db(dbName);

  console.log("Connected to database:", db.databaseName);

  const before = await db.collection("adminusers").find({}).toArray();
  console.log("Documents BEFORE:", before.length);
  before.forEach((u) => {
    console.log("  -", u.email, "| hash starts:", (u.password as string)?.slice(0, 30) + "...");
  });

  const email = process.argv[2] || "admin@example.com";
  const password = process.argv[3] || "admin123";
  const name = process.argv[4] || "Admin";

  const hash = await bcrypt.hash(password, 10);
  const selfTest = await bcrypt.compare(password, hash);
  console.log("\nbcrypt self-test:", selfTest);
  console.log("New hash:", hash);

  await db.collection("adminusers").deleteMany({ email });
  console.log("Deleted existing user(s) with email:", email);

  const result = await db.collection("adminusers").insertOne({
    email,
    password: hash,
    name,
    createdAt: new Date(),
  });
  console.log("Inserted new user with _id:", result.insertedId);

  const after = await db.collection("adminusers").findOne({ email });
  console.log("\nDocument AFTER:");
  console.log("  email:", after?.email);
  console.log("  name:", after?.name);
  console.log("  hash starts:", (after?.password as string)?.slice(0, 30) + "...");

  const verify = await bcrypt.compare(password, after?.password as string);
  console.log("\nVerify new hash against password:", verify);

  await client.close();
  console.log("\nDone.");
}

fixAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
