import { connectDB } from "@/lib/mongodb";
import { Menu, Page } from "lib/sfcc/types";

export async function getMenu(handle: string): Promise<Menu[]> {
  const baseMenu: Menu[] = [
    { title: "Home", path: "/" },
    { title: "Catalog", path: "/shop" },
  ];

  if (handle.includes("footer")) {
    try {
      const db = await connectDB();
      const docs = await db.collection("pages")
        .find({ status: "published" })
        .sort({ sortOrder: 1, title: 1 })
        .toArray();
      const dbPages = docs.map((doc: any) => ({
        title: doc.title,
        path: `/${doc.slug}`,
      }));
      const hasPublishedBlogPosts = await db.collection("blogs").countDocuments({ status: "published" }) > 0;
      const footerMenu = baseMenu.filter((item) => item.path !== "/shop");
      if (hasPublishedBlogPosts) footerMenu.push({ title: "Blog", path: "/blog" });
      return [...footerMenu, ...dbPages];
    } catch {
      return baseMenu.filter((item) => item.path !== "/shop");
    }
  }

  return baseMenu;
}

function dbPageToPage(doc: any): Page {
  return {
    id: doc._id.toString(),
    title: doc.title,
    handle: doc.slug,
    body: doc.content || "",
    bodySummary: doc.metaDescription || (doc.content ? doc.content.slice(0, 160) : ""),
    seo: {
      title: doc.metaTitle || doc.title,
      description: doc.metaDescription || "",
    },
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
  };
}

const staticPages: Page[] = [
  {
    id: "terms",
    title: "Terms & Conditions",
    handle: "terms-conditions",
    body: "",
    bodySummary: "",
    seo: { title: "Terms & Conditions", description: "" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "shipping",
    title: "Delivery Cost & Return Policy",
    handle: "shipping-return-policy",
    body: "",
    bodySummary: "",
    seo: { title: "Delivery Cost & Return Policy", description: "" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    handle: "privacy-policy",
    body: "",
    bodySummary: "",
    seo: { title: "Privacy Policy", description: "" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "faq",
    title: "Frequently Asked Questions",
    handle: "freqently-asked-questions",
    body: "",
    bodySummary: "",
    seo: { title: "Frequently Asked Questions", description: "" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function getPage(handle: string): Promise<Page | undefined> {
  try {
    const db = await connectDB();
    const doc = await db.collection("pages").findOne({ slug: handle, status: "published" });
    if (doc) return dbPageToPage(doc);
  } catch {
    // fallback to static pages on DB error
  }
  return staticPages.find((page) => page.handle === handle);
}

export async function getPages(): Promise<Page[]> {
  try {
    const db = await connectDB();
    const docs = await db.collection("pages")
      .find({ status: "published" })
      .toArray();
    const dbPages = docs.map(dbPageToPage);
    // Merge DB pages with static pages, DB pages take precedence by slug
    const staticByHandle = new Map(staticPages.map((p) => [p.handle, p]));
    for (const page of dbPages) {
      staticByHandle.set(page.handle, page);
    }
    return Array.from(staticByHandle.values());
  } catch {
    return staticPages;
  }
}
