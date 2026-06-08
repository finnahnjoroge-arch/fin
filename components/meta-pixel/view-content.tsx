"use client";

import { trackViewContent } from "lib/meta-pixel";
import { useEffect } from "react";

export function TrackViewContent({
  productId,
  variantId,
  value,
  currency,
}: {
  productId: string;
  variantId: string;
  value: number;
  currency: string;
}) {
  useEffect(() => {
    trackViewContent({
      content_ids: [variantId || productId],
      content_type: "product",
      value,
      currency,
    });
  }, [productId, variantId, value, currency]);

  return null;
}
