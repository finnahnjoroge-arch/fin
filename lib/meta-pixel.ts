// Safe Meta Pixel event helper
// The pixel base code is injected via custom scripts in the admin panel;
// this helper just fires the standard e-commerce events.

function sanitizeCurrency(code: string): string {
  const c = (code || "").toString().trim().toUpperCase();
  return c.length === 3 ? c : "KES";
}

function formatValue(value: number): number {
  const v = typeof value === "number" && !isNaN(value) ? value : 0;
  return Math.round(v * 100) / 100;
}

declare global {
  interface Window {
    fbq?: (
      command: "track" | "trackCustom",
      eventName: string,
      params?: Record<string, unknown>,
    ) => void;
  }
}

export function trackMetaEvent(
  eventName: string,
  params: Record<string, unknown>,
) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
  }
}

export function trackViewContent(params: {
  content_ids: string[];
  content_type: "product";
  value: number;
  currency: string;
}) {
  trackMetaEvent("ViewContent", {
    ...params,
    value: formatValue(params.value),
    currency: sanitizeCurrency(params.currency),
  });
}

export function trackAddToCart(params: {
  content_ids: string[];
  content_type: "product";
  value: number;
  currency: string;
  quantity?: number;
}) {
  trackMetaEvent("AddToCart", {
    ...params,
    value: formatValue(params.value),
    currency: sanitizeCurrency(params.currency),
  });
}

export function trackInitiateCheckout(params: {
  content_ids: string[];
  content_type: "product";
  value: number;
  currency: string;
  num_items: number;
}) {
  trackMetaEvent("InitiateCheckout", {
    ...params,
    value: formatValue(params.value),
    currency: sanitizeCurrency(params.currency),
  });
}

export function trackPurchase(params: {
  content_ids: string[];
  content_type: "product";
  value: number;
  currency: string;
  num_items: number;
  order_id?: string;
}) {
  trackMetaEvent("Purchase", {
    ...params,
    value: formatValue(params.value),
    currency: sanitizeCurrency(params.currency),
  });
}
