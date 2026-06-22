import { connectDB } from "@/lib/mongodb";

export interface FeedProduct {
  id: string;
  itemGroupId?: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  price: number;
  comparePrice?: number;
  availability: "in stock" | "out of stock";
  condition: "new";
  brand?: string;
  category?: string;
  googleProductCategory?: string;
  sku?: string;
  variantAttributes?: Record<string, string>;
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sanitizeXmlTagName(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/^[0-9]/, "_$&")
    .replace(/^-+/, "");
}

function getVariantAvailability(v: any): "in stock" | "out of stock" {
  return (v.enabled !== false) && (v.stock > 0) ? "in stock" : "out of stock";
}

/**
 * Maps a category name to a Google Product Category ID.
 * Add more mappings as needed from Google's taxonomy.
 */
function getGoogleProductCategory(categoryName: string): string {
  const googleCategoryMap: Record<string, string> = {
    "Watches": "143",
    "Men's Watches": "143",
    "Women's Watches": "143",
    "Smartwatches": "781",
    "Watch Bands": "178",
    "Watch Accessories": "178",
    "Jewelry": "389",
    "Fashion": "166",
  };
  return googleCategoryMap[categoryName] || categoryName;
}

export async function getFeedProducts(): Promise<FeedProduct[]> {
  const db = await connectDB();

  const [products, categories, brands] = await Promise.all([
    db.collection("products").find({ status: "active" }).toArray(),
    db.collection("categories").find().toArray(),
    db.collection("brands").find().toArray(),
  ]);

  const catMap = new Map<string, string>(categories.map((c: any) => [c._id.toString(), c.name] as [string, string]));
  const brandMap = new Map<string, string>(brands.map((b: any) => [b.slug, b.name] as [string, string]));

  const result: FeedProduct[] = [];

  for (const doc of products) {
    const parentId = doc._id.toString();
    const baseTitle = doc.name || "";
    const description = (doc.description || "").replace(/<[^>]*>/g, "").trim();
    const baseLink = `https://finnorah.co.ke/product/${doc.slug}`;
    const baseImage = doc.images?.[0] || "";
    const basePrice = doc.price || 0;
    const baseCompare = doc.comparePrice || undefined;

    // Support both old single `category` and new `categories` array
    let category: string | undefined;
    const categoryIds = new Set<string>();
    if (Array.isArray(doc.categories) && doc.categories.length > 0) {
      for (const c of doc.categories) {
        if (c) categoryIds.add(c.toString());
      }
    }
    if (doc.category) {
      categoryIds.add(doc.category.toString());
    }
    const categoryNames = [...categoryIds].map(id => catMap.get(id)).filter((n): n is string => !!n);
    if (categoryNames.length > 0) {
      category = categoryNames.join(" > ");
    }

    // Determine Google Product Category from the first category name
    const googleProductCategory = category ? getGoogleProductCategory(category) : undefined;

    let brand: string | undefined;
    const brandSlug = doc.brand?.toString?.() || doc.brand;
    if (brandSlug) {
      brand = brandMap.get(brandSlug) || brandSlug;
    }

    if (doc.type === "variable" && doc.variants?.length) {
      for (const v of doc.variants) {
        const variantId = v.sku || v._id?.toString() || `${parentId}_${v.name}`;
        const variantTitle = `${baseTitle} - ${v.name}`;
        const variantImage = v.images?.[0] || baseImage;
        const variantPrice = v.price ?? basePrice;
        const variantSku = v.sku || doc.sku;

        result.push({
          id: variantId,
          itemGroupId: parentId,
          title: variantTitle,
          description,
          link: baseLink,
          imageLink: variantImage,
          price: variantPrice,
          comparePrice: baseCompare,
          availability: getVariantAvailability(v),
          condition: "new",
          brand,
          category,
          googleProductCategory,
          sku: variantSku ? String(variantSku) : undefined,
          variantAttributes: v.attributes || undefined,
        });
      }
    } else {
      const availability = doc.stock > 0 ? "in stock" : "out of stock";
      result.push({
        id: doc.sku || parentId,
        title: baseTitle,
        description,
        link: baseLink,
        imageLink: baseImage,
        price: basePrice,
        comparePrice: baseCompare,
        availability,
        condition: "new",
        brand,
        category,
        googleProductCategory,
        sku: doc.sku ? String(doc.sku) : undefined,
      });
    }
  }

  return result;
}

function googleVariantAttributes(attrs?: Record<string, string>): string {
  if (!attrs) return "";
  const knownMap: Record<string, string> = {
    size: "g:size",
    color: "g:color",
    colour: "g:color",
    "choose color": "g:color",
    "select color": "g:color",
    material: "g:material",
    pattern: "g:pattern",
    gender: "g:gender",
    agegroup: "g:age_group",
    age_group: "g:age_group",
  };
  return Object.entries(attrs)
    .map(([key, value]) => {
      const normalizedKey = key
        .toLowerCase()
        .trim()
        .replace(/[\s_\-]+/g, " ");
      const tag = knownMap[normalizedKey] || `g:${sanitizeXmlTagName(key)}`;
      return `<${tag}>${escapeXml(value)}</${tag}>`;
    })
    .join("\n      ");
}

function facebookVariantAttributes(attrs?: Record<string, string>): string {
  if (!attrs) return "";
  const knownMap: Record<string, string> = {
    size: "size",
    color: "color",
    colour: "color",
    material: "material",
    pattern: "pattern",
    gender: "gender",
  };
  return Object.entries(attrs)
    .map(([key, value]) => {
      const tag = knownMap[key.toLowerCase()] || sanitizeXmlTagName(key);
      return `<${tag}>${escapeXml(value)}</${tag}>`;
    })
    .join("\n      ");
}

export function formatGoogleXml(products: FeedProduct[]): string {
  const items = products
    .map(
      (p) => `
    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      ${p.itemGroupId ? `<g:item_group_id>${escapeXml(p.itemGroupId)}</g:item_group_id>` : ""}
      <g:title>${escapeXml(p.title)}</g:title>
      <g:description>${escapeXml(p.description)}</g:description>
      <g:link>${escapeXml(p.link)}</g:link>
      <g:image_link>${escapeXml(p.imageLink)}</g:image_link>
      <g:price>${p.price.toFixed(2)} KES</g:price>
      <g:availability>${p.availability}</g:availability>
      <g:condition>${p.condition}</g:condition>
      ${p.brand ? `<g:brand>${escapeXml(p.brand)}</g:brand>` : ""}
      ${p.category ? `<g:product_type>${escapeXml(p.category)}</g:product_type>` : ""}
      ${p.googleProductCategory ? `<g:google_product_category>${escapeXml(p.googleProductCategory)}</g:google_product_category>` : ""}
      ${p.sku ? `<g:sku>${escapeXml(p.sku)}</g:sku>` : ""}
      ${googleVariantAttributes(p.variantAttributes)}
    </item>
  `
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Finnorah</title>
    <link>https://finnorah.co.ke</link>
    <description>Product feed for Google Merchant Center</description>
    ${items}
  </channel>
</rss>`;
}

export function formatFacebookXml(products: FeedProduct[]): string {
  const items = products
    .map(
      (p) => `
    <item>
      <id>${escapeXml(p.id)}</id>
      ${p.itemGroupId ? `<item_group_id>${escapeXml(p.itemGroupId)}</item_group_id>` : ""}
      <title>${escapeXml(p.title)}</title>
      <description>${escapeXml(p.description)}</description>
      <link>${escapeXml(p.link)}</link>
      <image_link>${escapeXml(p.imageLink)}</image_link>
      <price>${p.price.toFixed(2)} KES</price>
      <availability>${p.availability}</availability>
      <condition>${p.condition}</condition>
      ${p.brand ? `<brand>${escapeXml(p.brand)}</brand>` : ""}
      ${p.category ? `<product_type>${escapeXml(p.category)}</product_type>` : ""}
      ${p.googleProductCategory ? `<google_product_category>${escapeXml(p.googleProductCategory)}</google_product_category>` : ""}
      ${facebookVariantAttributes(p.variantAttributes)}
    </item>
  `
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Finnorah</title>
    <link>https://finnorah.co.ke</link>
    <description>Product feed for Facebook Catalog</description>
    ${items}
  </channel>
</rss>`;
}
