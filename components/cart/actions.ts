"use server";

import { TAGS } from "lib/constants";
import { revalidateTag } from "next/cache";

// Cart is managed client-side via useCart() context.
// These server actions are kept for compatibility with existing
// component bindings but do not interact with a backend cart.

export async function addItem(
  prevState: any,
  selectedVariantId: string | undefined
) {
  if (!selectedVariantId) {
    return "Error adding item to cart";
  }
  revalidateTag(TAGS.cart, "max");
  return "";
}

export async function removeItem(prevState: any, merchandiseId: string) {
  revalidateTag(TAGS.cart, "max");
  return "";
}

export async function updateItemQuantity(
  prevState: any,
  payload: {
    merchandiseId: string;
    quantity: number;
  }
) {
  revalidateTag(TAGS.cart, "max");
  return "";
}

export async function redirectToCheckout() {
  // No-op: checkout is handled client-side via /checkout page
}

export async function createCartAndSetCookie() {
  // No-op: cart is managed client-side
}
