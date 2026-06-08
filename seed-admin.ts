import bcrypt from "bcryptjs";
import { connectDB } from "./lib/mongodb";

async function seedAdmin() {
  const db = await connectDB();
  const collection = db.collection("adminusers");

  const email = "admin@kingstech.com";
  const password = "admin123";
  const name = "Admin";

  const existing = await collection.findOne({ email });
  if (existing) {
    console.log("Admin user already exists:", email);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await collection.insertOne({
    email,
    password: hashedPassword,
    name,
    createdAt: new Date(),
  });

  console.log("Admin user created successfully!");
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("You can now log in at /admin/login");
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Error seeding admin:", err);
  process.exit(1);
});
