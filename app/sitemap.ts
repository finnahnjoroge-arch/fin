import { connectDB } from "@/lib/mongodb";
import { baseUrl } from "lib/utils";
import { MetadataRoute } from "next";

type Route = {
  url: string;
  lastModified: string;
  priority?: number;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
};

function toISO(date: Date | string | undefined | null): string {
  if (!date) return new Date().toISOString();
  if (typeof date === "string") return date;
  return date.toISOString();
}

function validSlug(slug: string | undefined | null): string | null {
  if (!slug || typeof slug !== "string") return null;
  return slug.trim();
}

const excludedPageSlugs = new Set([
  "contact-us",
  "privacy-policy",
  "about",
  "returns-and-refunds",
  "terms-and-conditions",
  "terms-conditions",
  "shipping-return-policy",
  "freqently-asked-questions",
]);

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: Route[] = [
    { url: `${baseUrl}/`, lastModified: new Date().toISOString(), priority: 1.0, changeFrequency: "daily" },
    { url: `${baseUrl}/shop`, lastModified: new Date().toISOString(), priority: 0.9, changeFrequency: "daily" },
    { url: `${baseUrl}/blog`, lastModified: new Date().toISOString(), priority: 0.5, changeFrequency: "weekly" },
  ];

  const fetchedRoutes: Route[] = [];

  try {
    const db = await connectDB();

    // Categories
    try {
      const categories = await db.collection("categories").find().project({ slug: 1, updatedAt: 1 }).toArray();
      for (const doc of categories) {
        const slug = validSlug(doc.slug);
        if (slug) {
          fetchedRoutes.push({
            url: `${baseUrl}/product-category/${slug}`,
            lastModified: toISO(doc.updatedAt),
            priority: 0.8,
            changeFrequency: "weekly",
          });
        }
      }
    } catch {
      // ignore
    }

    // Brands
    try {
      const brands = await db.collection("brands").find().project({ slug: 1, updatedAt: 1, createdAt: 1 }).toArray();
      for (const doc of brands) {
        const slug = validSlug(doc.slug);
        if (slug) {
          fetchedRoutes.push({
            url: `${baseUrl}/brand/${slug}`,
            lastModified: toISO(doc.updatedAt ?? doc.createdAt),
            priority: 0.7,
            changeFrequency: "weekly",
          });
        }
      }
    } catch {
      // ignore
    }

    // Products
    try {
      const products = await db.collection("products")
        .find({ status: "active" })
        .project({ slug: 1, updatedAt: 1 })
        .toArray();
      for (const doc of products) {
        const slug = validSlug(doc.slug);
        if (slug) {
          fetchedRoutes.push({
            url: `${baseUrl}/product/${slug}`,
            lastModified: toISO(doc.updatedAt),
            priority: 0.6,
            changeFrequency: "weekly",
          });
        }
      }
    } catch {
      // ignore
    }

    // Pages
    try {
      const pages = await db.collection("pages").find({ status: "published" }).project({ slug: 1, updatedAt: 1 }).toArray();
      for (const doc of pages) {
        const slug = validSlug(doc.slug);
        if (slug && !excludedPageSlugs.has(slug)) {
          fetchedRoutes.push({
            url: `${baseUrl}/${slug}`,
            lastModified: toISO(doc.updatedAt),
            priority: 0.5,
            changeFrequency: "monthly",
          });
        }
      }
    } catch {
      // ignore
    }

    // Blog posts
    try {
      const posts = await db.collection("blogs")
        .find({ status: "published" })
        .project({ slug: 1, updatedAt: 1, publishedAt: 1 })
        .toArray();
      for (const doc of posts) {
        const slug = validSlug(doc.slug);
        if (slug) {
          fetchedRoutes.push({
            url: `${baseUrl}/blog/${slug}`,
            lastModified: toISO(doc.updatedAt ?? doc.publishedAt),
            priority: 0.5,
            changeFrequency: "monthly",
          });
        }
      }
    } catch {
      // ignore
    }
  } catch {
    // If DB connection itself fails, return static routes only
  }

  return [...staticRoutes, ...fetchedRoutes];
}
