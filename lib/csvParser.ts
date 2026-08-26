import type { WooProduct } from "@/models/productSchema";
import Papa from "papaparse";

// ── Constants ─────────────────────────────────────────────────────────

/** Number of attribute column groups to scan (1‑based, so 6 → Attribute 1 … Attribute 6) */
const MAX_ATTRIBUTES = 6;

/**
 * Direct field‑to‑header mapping for WebToffee CSV columns.
 * The camelCase key is the model field path; the value is the exact CSV column header.
 */
const FIELD_TO_HEADER: Record<string, string> = {
  id: "ID",
  type: "Type",
  sku: "SKU",
  name: "Name",
  published: "Published",
  isFeatured: "Is featured?",
  visibility: "Visibility in catalog",
  shortDescription: "Short description",
  description: "Description",
  dateOnSaleFrom: "Date sale price starts",
  dateOnSaleTo: "Date sale price ends",
  taxStatus: "Tax status",
  taxClass: "Tax class",
  inStock: "In stock?",
  stock: "Stock",
  lowStockAmount: "Low stock amount",
  backordersAllowed: "Backorders allowed?",
  soldIndividually: "Sold individually?",
  weight: "Weight (kg)",
  "dimensions.length": "Length (cm)",
  "dimensions.width": "Width (cm)",
  "dimensions.height": "Height (cm)",
  allowReviews: "Allow customer reviews?",
  purchaseNote: "Purchase note",
  regularPrice: "Regular price",
  salePrice: "Sale price",
  categories: "Categories",
  tags: "Tags",
  shippingClass: "Shipping class",
  images: "Images",
  downloadLimit: "Download limit",
  downloadExpiryDays: "Download expiry days",
  parent: "Parent",
  groupedProducts: "Grouped products",
  upsells: "Upsells",
  crossSells: "Cross-sells",
  externalUrl: "External URL",
  buttonText: "Button text",
  position: "Position",
};

/**
 * Header‑to‑field mapping for the **real** WebToffee CSV export format.
 * These are the column headers exported natively by the WebToffee plugin.
 */
const REAL_WEBTOFFEE_HEADER_TO_FIELD: Record<string, string> = {
  post_title: "name",
  sku: "sku",
  parent_sku: "parentID",
  id: "id",
  post_content: "description",
  post_excerpt: "shortDescription",
  post_status: "published",
  regular_price: "regularPrice",
  sale_price: "salePrice",
  stock: "stock",
  stock_status: "inStock",
  weight: "weight",
  length: "dimensions.length",
  width: "dimensions.width",
  height: "dimensions.height",
  tax_status: "taxStatus",
  tax_class: "taxClass",
  backorders: "backordersAllowed",
  sold_individually: "soldIndividually",
  low_stock_amount: "lowStockAmount",
  visibility: "visibility",
  purchase_note: "purchaseNote",
  sale_price_dates_from: "dateOnSaleFrom",
  sale_price_dates_to: "dateOnSaleTo",
  download_limit: "downloadLimit",
  download_expiry: "downloadExpiryDays",
  images: "images",
  product_url: "externalUrl",
  button_text: "buttonText",
  menu_order: "position",
  "tax:product_cat": "categories",
  "tax:product_tag": "tags",
  "tax:product_type": "type",
  "tax:product_shipping_class": "shippingClass",
  upsell_ids: "upsells",
  crosssell_ids: "crossSells",
  children: "groupedProducts",
  post_name: "slug",
};

// Invert the mapping for header‑to‑field lookups
const HEADER_TO_FIELD: Record<string, string> = {};
for (const [field, header] of Object.entries(FIELD_TO_HEADER)) {
  HEADER_TO_FIELD[header] = field;
}

/**
 * Top‑level fields that are boolean ("1" ↔ true).
 * Attribute booleans and meta fields are handled separately.
 */
const BOOLEAN_FIELDS = new Set<string>([
  "isFeatured",
  "inStock",
  "backordersAllowed",
  "soldIndividually",
  "allowReviews",
]);

/**
 * Real WebToffee format fields that need special string‑to‑boolean conversion.
 * "instock" → true, "outofstock" → false; "yes"/"notify" → true, etc.
 */
const REAL_BOOLEAN_FIELDS = new Set<string>(["inStock", "backordersAllowed", "soldIndividually"]);

/** Fields whose CSV value is pipe‑separated (`|`) */
const PIPE_SEPARATED_FIELDS = new Set<string>([
  "categories",
  "tags",
  "images",
  "groupedProducts",
  "upsells",
  "crossSells",
]);

/** Fields that should be parsed as numbers */
const NUMBER_FIELDS = new Set<string>([
  "published",
  "stock",
  "lowStockAmount",
  "weight",
  "regularPrice",
  "salePrice",
  "downloadLimit",
  "downloadExpiryDays",
  "position",
]);

// ── Helpers ───────────────────────────────────────────────────────────

/** Split a pipe‑separated WebToffee value into an array of trimmed strings. */
function splitPipe(value: string): string[] {
  if (!value || !value.trim()) return [];
  return value
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Join an array back into the `|` format used by WebToffee. */
function joinPipe(arr: string[]): string {
  return (arr ?? []).join("|");
}

/** Convert a WebToffee boolean string ("1" / "0") to a JS boolean. */
function toBool(val: string): boolean {
  return val === "1";
}

/** Convert a JS boolean back to WebToffee format. */
function fromBool(val: boolean): string {
  return val ? "1" : "0";
}

/** Safely parse a number; returns 0 for empty/invalid strings. */
function toNumber(val: string | undefined): number {
  if (!val || val.trim() === "") return 0;
  const n = parseFloat(val);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Return all unique meta‑data keys across a set of products.
 * Used when generating CSV so every product row includes every Meta column.
 */
function collectAllMetaKeys(products: WooProduct[]): string[] {
  const keySet = new Set<string>();
  for (const p of products) {
    for (const m of p.metaData ?? []) {
      if (m.key) keySet.add(m.key);
    }
  }
  return Array.from(keySet).sort();
}

// ── Parse: CSV → Products ─────────────────────────────────────────────

/**
 * Parse a raw WebToffee WooCommerce product CSV string and return an array
 * of WooProduct objects.
 *
 * Skips any row where `sku` is empty.
 */
export function parseWebToffeeCSV(fileContent: string): WooProduct[] {
  // Strip UTF-8 BOM if present before parsing
  const cleanContent = fileContent.replace(/^\uFEFF/, "");

  const result = Papa.parse<Record<string, string>>(cleanContent, {
    header: true,
    skipEmptyLines: true,
    transform: (val) => val.trim(),
  });

  if (result.errors.length > 0) {
    console.warn("CSV parse warnings:", result.errors);
  }

  // ── Detect which format this CSV is by checking for known headers ──
  const firstField = (result.meta.fields?.[0] ?? "").replace(/^\uFEFF/, "").trim();
  const isRealWebToffee =
    firstField === "post_title" ||
    result.meta.fields?.includes("post_title") ||
    result.meta.fields?.includes("sku") ||
    result.meta.fields?.some((f) => f.replace(/^\uFEFF/, "") === "post_title");
  const isStandardFormat =
    result.meta.fields?.includes("Name") || result.meta.fields?.includes("SKU");

  // Use the appropriate header mapping
  const activeHeaderMap = isRealWebToffee
    ? REAL_WEBTOFFEE_HEADER_TO_FIELD
    : HEADER_TO_FIELD;

  const rows = result.data;
  const products: WooProduct[] = [];

  for (const row of rows) {
    // Skip rows without a SKU
    const skuVal =
      (row["SKU"] ?? row["sku"] ?? "").trim();
    if (!skuVal) continue;

    // ── Build the product object ──
    const product: Record<string, unknown> = {};

    // Map direct fields
    for (const [header, val] of Object.entries(row)) {
      const fieldPath = activeHeaderMap[header];
      if (!fieldPath) continue;

      const trimmedVal = val.trim();
      if (trimmedVal === "") continue;

      // Type conversions
      if (BOOLEAN_FIELDS.has(fieldPath)) {
        // Standard format: "1"/"0"
        product[fieldPath] = toBool(trimmedVal);
      } else if (REAL_BOOLEAN_FIELDS.has(fieldPath) && isRealWebToffee) {
        // Real WebToffee format: convert string values
        product[fieldPath] = realToBool(trimmedVal, fieldPath);
      } else if (NUMBER_FIELDS.has(fieldPath) || fieldPath.startsWith("dimensions.")) {
        if (fieldPath === "published") {
          // published: map "publish" or "Published" → 1, else 0 (real format)
          // or standard format: already numeric
          product[fieldPath] =
            trimmedVal.toLowerCase() === "publish" || trimmedVal.toLowerCase() === "published" ? 1 : isRealWebToffee ? 0 : parseInt(trimmedVal, 10) || 1;
        } else {
          product[fieldPath] = toNumber(trimmedVal);
        }
      } else if (PIPE_SEPARATED_FIELDS.has(fieldPath)) {
        product[fieldPath] = splitPipe(trimmedVal);
      } else {
        product[fieldPath] = trimmedVal;
      }
    }

    // ── Fallback: use post_name as SKU if sku is empty ──
    if (!product.sku) {
      product.sku = row["post_name"]?.trim() || row["ID"]?.trim() || "";
    }

    // ── Dimensions nested object ──
    if (isRealWebToffee) {
      // Real WebToffee: individual length/width/height columns mapped via header map
      const dLength = product["dimensions.length"] as number | undefined;
      const dWidth = product["dimensions.width"] as number | undefined;
      const dHeight = product["dimensions.height"] as number | undefined;
      if (dLength !== undefined || dWidth !== undefined || dHeight !== undefined) {
        product["dimensions"] = {
          length: dLength ?? 0,
          width: dWidth ?? 0,
          height: dHeight ?? 0,
        };
      }
      delete product["dimensions.length"];
      delete product["dimensions.width"];
      delete product["dimensions.height"];
    } else {
      // Standard format: "Length (cm)", "Width (cm)", "Height (cm)" columns
      const length = toNumber(row["Length (cm)"]);
      const width = toNumber(row["Width (cm)"]);
      const height = toNumber(row["Height (cm)"]);
      if (length || width || height) {
        product["dimensions"] = { length, width, height };
      }
    }

    // ── Attributes (dynamic, up to MAX_ATTRIBUTES) ──
    const attrs: WooProduct["attributes"] = [];
    if (isRealWebToffee) {
      // Real WebToffee format uses "pa_" prefixed columns for attributes
      // We'll scan for any column starting with "attribute:pa_"
      const attrNames = new Set<string>();
      for (const col of Object.keys(row)) {
        const match = col.match(/^attribute:(pa_.+)$/);
        if (match) {
          attrNames.add(match[1]!);
        }
      }
      for (const attrName of attrNames) {
        const value =
          (row[`attribute:${attrName}`] ?? "").trim();
        if (!value) continue;
        attrs.push({
          name: attrName,
          value,
          visible: true,
          global: true,
        });
      }
    } else {
      for (let i = 1; i <= MAX_ATTRIBUTES; i++) {
        const name = (row[`Attribute ${i} name`] ?? "").trim();
        const value = (row[`Attribute ${i} value(s)`] ?? "").trim();

        // Skip if both name and value are empty
        if (!name && !value) continue;

        const visibleRaw = (row[`Attribute ${i} visible`] ?? "").trim();
        const globalRaw = (row[`Attribute ${i} global`] ?? "").trim();

        attrs.push({
          name,
          value,
          visible: visibleRaw === "" ? true : toBool(visibleRaw),
          global: globalRaw === "" ? true : toBool(globalRaw),
        });
      }
    }
    product["attributes"] = attrs;

    // ── Meta‑data ──
    const metaData: WooProduct["metaData"] = [];
    if (isRealWebToffee) {
      // Real WebToffee format: columns starting with "meta:"
      for (const [col, val] of Object.entries(row)) {
        if (
          col.startsWith("meta:") &&
          !REAL_WEBTOFFEE_HEADER_TO_FIELD[col] &&
          val.trim() !== ""
        ) {
          const key = col.slice("meta:".length);
          metaData.push({ key, value: val.trim() });
        }
      }
    } else {
      // Standard format: columns starting with "Meta: "
      for (const [col, val] of Object.entries(row)) {
        if (col.startsWith("Meta: ") && val.trim() !== "") {
          const key = col.slice("Meta: ".length).trim();
          metaData.push({ key, value: val.trim() });
        }
      }
    }
    product["metaData"] = metaData;

    // Ensure arrays exist even for empty fields
    for (const field of PIPE_SEPARATED_FIELDS) {
      if (!Array.isArray(product[field])) {
        product[field] = [];
      }
    }

    products.push(product as unknown as WooProduct);
  }

  return products;
}

/**
 * Convert a real WebToffee string value to boolean.
 * "instock" / "yes" / "notify" → true; everything else → false
 */
function realToBool(val: string, field: string): boolean {
  const lower = val.toLowerCase().trim();
  if (field === "inStock") {
    return lower === "instock";
  }
  if (field === "backordersAllowed") {
    return lower === "yes" || lower === "notify";
  }
  if (field === "soldIndividually") {
    return lower === "yes";
  }
  return lower === "1" ? true : false;
}

// ── Generate: Products → CSV ──────────────────────────────────────────

/**
 * Convert an array of WooProduct objects back to a WebToffee‑compatible CSV string.
 *
 * Always outputs all 6 attribute groups (even if empty) and includes every
 * unique Meta key discovered across the dataset.
 */
export function generateWebToffeeCSV(products: WooProduct[]): string {
  // Collect all unique meta keys so every row has the same columns
  const metaKeys = collectAllMetaKeys(products);

  // Build header order (matching WebToffee's conventional order)
  const orderedHeaders: string[] = [];

  // 1. Standard mapped fields in order
  const standardFields = [
    "id", "type", "sku", "name", "published", "isFeatured", "visibility",
    "shortDescription", "description", "dateOnSaleFrom", "dateOnSaleTo",
    "taxStatus", "taxClass", "inStock", "stock", "lowStockAmount",
    "backordersAllowed", "soldIndividually", "weight",
    "dimensions.length", "dimensions.width", "dimensions.height",
    "allowReviews", "purchaseNote", "regularPrice", "salePrice",
    "categories", "tags", "shippingClass", "images",
    "downloadLimit", "downloadExpiryDays", "parent",
    "groupedProducts", "upsells", "crossSells",
    "externalUrl", "buttonText", "position",
  ];
  orderedHeaders.push(
    ...standardFields.map((f) => FIELD_TO_HEADER[f] ?? f),
  );

  // 2. Attribute columns (1‑6) — always output all 6 groups even if empty
  for (let i = 1; i <= MAX_ATTRIBUTES; i++) {
    orderedHeaders.push(`Attribute ${i} name`);
    orderedHeaders.push(`Attribute ${i} value(s)`);
    orderedHeaders.push(`Attribute ${i} visible`);
    orderedHeaders.push(`Attribute ${i} global`);
  }

  // 3. Meta columns
  for (const key of metaKeys) {
    orderedHeaders.push(`Meta: ${key}`);
  }

  // Transform each product into a CSV row object keyed by WebToffee header
  const dataRows: Record<string, string>[] = products.map((p) => {
    const row: Record<string, string> = {};

    // Standard fields
    for (const field of standardFields) {
      const header = FIELD_TO_HEADER[field];
      if (!header) continue;

      let val: unknown;

      // Handle nested dimensions
      if (field === "dimensions.length") {
        val = p.dimensions?.length ?? 0;
      } else if (field === "dimensions.width") {
        val = p.dimensions?.width ?? 0;
      } else if (field === "dimensions.height") {
        val = p.dimensions?.height ?? 0;
      } else {
        val = (p as unknown as Record<string, unknown>)[field];
      }

      row[header] = formatCellValue(field, val);
    }

    // Attributes — always output all 6 groups
    for (let i = 0; i < MAX_ATTRIBUTES; i++) {
      const attr = (p.attributes ?? [])[i];
      const idx = i + 1;
      row[`Attribute ${idx} name`] = attr?.name ?? "";
      row[`Attribute ${idx} value(s)`] = attr?.value ?? "";
      row[`Attribute ${idx} visible`] = attr !== undefined ? fromBool(attr.visible) : "";
      row[`Attribute ${idx} global`] = attr !== undefined ? fromBool(attr.global) : "";
    }

    // Meta
    for (const key of metaKeys) {
      const entry = (p.metaData ?? []).find((m) => m.key === key);
      row[`Meta: ${key}`] = entry?.value ?? "";
    }

    return row;
  });

  return Papa.unparse(
    { fields: orderedHeaders, data: dataRows },
    {
      quotes: true,
      quoteChar: '"',
      delimiter: ",",
      newline: "\n",
    },
  );
}

// ── Cell formatter (generator helper) ─────────────────────────────────

/** Convert a model field value into its CSV string representation. */
function formatCellValue(field: string, val: unknown): string {
  if (val === undefined || val === null) return "";

  if (BOOLEAN_FIELDS.has(field)) {
    return fromBool(val as boolean);
  }

  if (NUMBER_FIELDS.has(field)) {
    return String(val);
  }

  if (PIPE_SEPARATED_FIELDS.has(field)) {
    return joinPipe(val as string[]);
  }

  return String(val);
}
