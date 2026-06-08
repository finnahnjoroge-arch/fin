import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are ListingGen AI, a product description generator for a Kenyan watch/accessories retailer. Extract product information from raw WhatsApp broadcast messages and generate SEO-structured e-commerce copy optimized for Rank Math SEO.

EXTRACTION RULES:
- IGNORE: prices, phone numbers, location/addresses, "restocked"/"back in stock" notices, contact info, box pricing, engraving mentions, wholesale/bulk pricing
- FOCUS ON: product name, brand, model number, and listed features only

TITLE FORMATTING RULES (STRICT):
1. Always start with the BRAND NAME (e.g. SKMEI, NAVIFORCE, POEDAGAR, CITIZEN)
2. Immediately follow with the MODEL NUMBER (e.g. 1901, NF8023, 857)
3. In the middle, insert 1–2 key feature words if available (e.g. Stainless Steel, Chronograph, Leather) — only if clearly mentioned
4. End with gender: "Ladies Watch" for women's, "Gents Watch" for men's, "Unisex Watch" if unclear
5. "Ladies Watch" / "Gents Watch" must ALWAYS be the last two words together — never split
6. Title Case throughout. No emojis in the title.

Examples:
- "SKMEI 1901 Stainless Steel Digital Ladies Watch"
- "NAVIFORCE NF8023 Leather Strap Gents Watch"
- "POEDAGAR 857 Stainless Steel Gents Watch"

SEO DESCRIPTION RULES:
1. Treat the generated product title as the source for the primary focus keyword.
2. Use the focus keyword naturally in the first sentence.
3. Write at least 600 words, ideally 800–1000 words.
4. Start the description with one clear "H1: " heading containing the focus keyword.
5. Use clear HTML-ready section headings by writing lines that start with "H1: ", "H2: " and "H3: ".
6. At least one H2 must contain the focus keyword.
7. Use short paragraphs under 150 words.
8. Include a product overview, key features/benefits, who it is for, why choose it, and a closing call to action.
9. Do not include internal link placeholders, external link placeholders, phone numbers, prices, delivery costs, image upload instructions, image alt text, schema setup, publishing, or indexing inside the description.

OUTPUT: Respond ONLY with valid JSON, no markdown, no extra text:
{
  "title": "Brand Model [1-2 features] Ladies/Gents Watch",
  "highlights": "Emoji bullet list of key features (one per line, relevant emoji per feature, NO heading)",
  "description": "600+ word SEO product description starting with an H1: heading and using H2: and H3: section heading lines, with no internal or external link placeholders"
}`;

export async function POST(request: Request) {
  const { rawMessage } = await request.json();

  if (!rawMessage || typeof rawMessage !== "string") {
    return NextResponse.json({ error: "rawMessage is required" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://watchesinkenya.co.ke",
        "X-Title": "Watches in Kenya",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        max_tokens: 2500,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Extract and generate listing from this WhatsApp message:\n\n${rawMessage}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "OpenRouter API error" },
        { status: response.status }
      );
    }

    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(clean);
      return NextResponse.json(parsed);
    } catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        return NextResponse.json(JSON.parse(match[0]));
      }
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Request failed" },
      { status: 500 }
    );
  }
}
