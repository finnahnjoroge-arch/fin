import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-4o-mini";

const SYSTEM_PROMPT = `You are an expert e-commerce copywriter for a Kenyan retail store specializing in watches, perfumes, and fashion accessories.

Your task is to extract product details from the provided raw text (often from social media, WhatsApp broadcasts, or inventory lists).

STRICT RULES:
1. Extract ONLY factual product information: name, features, specifications, colors, materials, design details.
2. IGNORE and DISCARD: prices (KSh, USD, any currency), phone numbers, contact details, shop locations/addresses, emojis, WhatsApp links, social media handles, promotional hype (e.g., "RESTOCK ALERT", "HOT DEAL", "LIMITED STOCK", "ORDER NOW"), and any other marketing fluff.
3. If the input contains multiple clearly distinct products (e.g., separate WhatsApp broadcast messages about different items), return ALL of them as a JSON array. If you're unsure whether products are distinct, default to returning a single product in an array.
4. For the "name" field, generate an SEO-optimized product title (NOT a plain product name). Follow these format rules:
   - Format: [Brand] [Model Number] [Spec 1] [Spec 2] [Material/Type] [Gender] [Category]
   - NO dashes, NO hyphens, NO punctuation separating the title — it flows as one natural phrase
   - Model number MUST follow brand name immediately if present
   - Weave the 2 best specs naturally into the title as adjectives/descriptors before the product type
   - Gender and category come at the end
   - Examples of CORRECT format:
     • "OLEVS 6898 Water Resistant Genuine Leather Mens Watch"
     • "OLEVS 6898 Day Date Display Water Resistant Leather Mens Watch"
     • "Binbond 203 Chronograph Calendar Stainless Steel Mens Watch"
     • "Gedi Vintage Water Resistant Genuine Leather Ladies Watch"
     • "TEVISE Automatic Mechanical Chronograph Stainless Steel Mens Watch"
   - Max 70 characters
   - No emojis, no prices, no dashes, no promo words
5. For "description", write 2-4 professional, sales-friendly sentences. Use polished English suitable for a retail website. Focus on benefits and quality, not price or urgency.
6. For "keyFeatures", list 3-7 bullet-style short phrases highlighting specs, materials, design elements, and functional features. Each should be a concise phrase (no full sentences with periods).

OUTPUT FORMAT — You MUST output ONLY valid JSON, nothing else. No markdown code fences, no preamble, no explanation. ALWAYS return an array of products (even for a single product).

[
  {
    "name": "string",
    "description": "string",
    "keyFeatures": ["string", "string", ...]
  }
]

If you absolutely cannot find any product information, return an empty array:
[]`;

interface ProductInfo {
  name: string;
  description: string;
  keyFeatures: string[];
}

function validateSingleProduct(data: unknown): ProductInfo {
  if (!data || typeof data !== "object") {
    throw new Error("Product entry is not a valid JSON object");
  }

  const obj = data as Record<string, unknown>;

  const name = typeof obj.name === "string" ? obj.name.trim() : "";
  const description = typeof obj.description === "string" ? obj.description.trim() : "";
  const keyFeatures = Array.isArray(obj.keyFeatures)
    ? obj.keyFeatures.filter((f): f is string => typeof f === "string").map((f) => f.trim())
    : [];

  return { name, description, keyFeatures };
}

function validateProducts(data: unknown): ProductInfo[] {
  if (Array.isArray(data)) {
    return data.map(validateSingleProduct);
  }
  // Single object response — wrap in array
  return [validateSingleProduct(data)];
}

function extractJsonFromText(text: string): string {
  const trimmed = text.trim();

  // Remove markdown code fences if present
  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/, "")
    .trim();

  // Try array first: find the first '[' and last ']'
  const firstSquare = withoutFences.indexOf("[");
  const lastSquare = withoutFences.lastIndexOf("]");

  if (firstSquare !== -1 && lastSquare !== -1 && firstSquare < lastSquare) {
    return withoutFences.slice(firstSquare, lastSquare + 1);
  }

  // Fall back to object: find first '{' and last '}'
  const firstBrace = withoutFences.indexOf("{");
  const lastBrace = withoutFences.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON object or array found in model response");
  }

  return withoutFences.slice(firstBrace, lastBrace + 1);
}

export async function POST(req: NextRequest) {
  // 1. Check for API key
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("[generate-product-info] OPENROUTER_API_KEY is not set in environment");
    return NextResponse.json(
      { error: "Server configuration error: API key not set" },
      { status: 500 }
    );
  }

  // 2. Parse the request body
  let body: { rawText?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const rawText = body?.rawText?.trim();
  if (!rawText) {
    return NextResponse.json(
      { error: 'Field "rawText" is required and must be a non-empty string' },
      { status: 400 }
    );
  }

  // 3. Call OpenRouter
  let response: Response;
  try {
    response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Kenyan Retail Store - Product Info Generator",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: rawText },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });
  } catch (error) {
    console.error("[generate-product-info] Network error:", error);
    return NextResponse.json(
      { error: "Failed to connect to AI service. Please try again later." },
      { status: 502 }
    );
  }

  // 4. Handle non-200 responses from OpenRouter
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    console.error(
      `[generate-product-info] OpenRouter error ${response.status}:`,
      errorText
    );
    return NextResponse.json(
      { error: `AI service returned an error (${response.status}). Please try again.` },
      { status: 502 }
    );
  }

  // 5. Parse the OpenRouter response
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    console.error("[generate-product-info] Failed to parse OpenRouter response as JSON");
    return NextResponse.json(
      { error: "Received an invalid response from AI service." },
      { status: 502 }
    );
  }

  // 6. Extract the message content
  const resultObj = result as Record<string, unknown>;
  const choices = resultObj?.choices as Array<Record<string, unknown>> | undefined;
  const messageContent = choices?.[0]?.message;

  if (!messageContent || typeof (messageContent as Record<string, unknown>).content !== "string") {
    console.error(
      "[generate-product-info] Unexpected response structure:",
      JSON.stringify(result).slice(0, 500)
    );
    return NextResponse.json(
      { error: "AI service returned an unexpected response structure." },
      { status: 502 }
    );
  }

  const rawContent = (messageContent as Record<string, string>).content;

  // 7. Extract JSON from the model's response
  let parsed: unknown;
  try {
    const jsonString = extractJsonFromText(rawContent);
    parsed = JSON.parse(jsonString);
  } catch (error) {
    console.error(
      "[generate-product-info] Failed to parse JSON from model:",
      error,
      "Raw content:",
      rawContent.slice(0, 500)
    );
    return NextResponse.json(
      { error: "AI service returned malformed data. Please try again." },
      { status: 502 }
    );
  }

  // 8. Validate and sanitize — always return { products: ProductInfo[] }
  try {
    const products = validateProducts(parsed);
    return NextResponse.json({ products });
  } catch (error) {
    console.error("[generate-product-info] Validation error:", error);
    return NextResponse.json(
      { error: "AI service returned data in an unexpected format." },
      { status: 502 }
    );
  }
}