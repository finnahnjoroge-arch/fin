"use client";

import { trackAddToCart } from "lib/meta-pixel";
import { Cart, CartItem, Product, ProductVariant } from "lib/sfcc/types";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

type UpdateType = "plus" | "minus" | "delete";

type CartContextType = {
  cart: Cart | undefined;
  updateCartItem: (merchandiseId: string, updateType: UpdateType) => void;
  addCartItem: (variant: ProductVariant, product: Product) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "cart";

function calculateItemCost(quantity: number, price: string): string {
  return (Number(price) * quantity).toString();
}

function applyItemUpdate(
  item: CartItem,
  updateType: UpdateType,
): CartItem | null {
  if (updateType === "delete") return null;

  const newQuantity =
    updateType === "plus" ? item.quantity + 1 : item.quantity - 1;
  if (newQuantity === 0) return null;

  const singleItemAmount = Number(item.cost.totalAmount.amount) / item.quantity;
  const newTotalAmount = calculateItemCost(
    newQuantity,
    singleItemAmount.toString(),
  );

  return {
    ...item,
    quantity: newQuantity,
    cost: {
      ...item.cost,
      totalAmount: {
        ...item.cost.totalAmount,
        amount: newTotalAmount,
      },
    },
  };
}

function createOrUpdateCartItem(
  existingItem: CartItem | undefined,
  variant: ProductVariant,
  product: Product,
): CartItem {
  const quantity = existingItem ? existingItem.quantity + 1 : 1;
  const totalAmount = calculateItemCost(quantity, variant.price.amount);

  return {
    id: existingItem?.id || crypto.randomUUID(),
    quantity,
    cost: {
      totalAmount: {
        amount: totalAmount,
        currencyCode: variant.price.currencyCode,
      },
    },
    merchandise: {
      id: variant.id,
      title: variant.title,
      selectedOptions: variant.selectedOptions,
      sku: variant.sku,
      product: {
        id: product.id,
        handle: product.handle,
        title: product.title,
        featuredImage: product.featuredImage,
        image: variant.image,
        sku: product.sku,
      },
    },
  };
}

function updateCartTotals(
  lines: CartItem[],
): Pick<Cart, "totalQuantity" | "cost"> {
  const totalQuantity = lines.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = lines.reduce(
    (sum, item) => sum + Number(item.cost.totalAmount.amount),
    0,
  );
  const currencyCode = lines[0]?.cost.totalAmount.currencyCode ?? "KES";

  return {
    totalQuantity,
    cost: {
      subtotalAmount: { amount: totalAmount.toString(), currencyCode },
      totalAmount: { amount: totalAmount.toString(), currencyCode },
      totalTaxAmount: { amount: "0", currencyCode },
    },
  };
}

function createEmptyCart(): Cart {
  return {
    id: undefined,
    checkoutUrl: "",
    totalQuantity: 0,
    lines: [],
    cost: {
      subtotalAmount: { amount: "0", currencyCode: "KES" },
      totalAmount: { amount: "0", currencyCode: "KES" },
      totalTaxAmount: { amount: "0", currencyCode: "KES" },
    },
  };
}

function readCartFromStorage(): Cart {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) return JSON.parse(raw) as Cart;
  } catch { /* ignore */ }
  return createEmptyCart();
}

function saveCartToStorage(cart: Cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch { /* ignore */ }
}

function dispatchCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
}

function dispatchCartItemAdded() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart:item-added"));
  }
}

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, setCartState] = useState<Cart | undefined>(undefined);

  // hydrate from localStorage once on mount
  useEffect(() => {
    setCartState(readCartFromStorage());
  }, []);

  const setCart = useCallback((updater: (prev: Cart) => Cart) => {
    setCartState((prev) => {
      const next = updater(prev || createEmptyCart());
      saveCartToStorage(next);
      dispatchCartUpdated();
      return next;
    });
  }, []);

  const updateCartItem = useCallback(
    (merchandiseId: string, updateType: UpdateType) => {
      setCart((currentCart) => {
        const updatedLines = currentCart.lines
          .map((item) =>
            item.merchandise.id === merchandiseId
              ? applyItemUpdate(item, updateType)
              : item,
          )
          .filter(Boolean) as CartItem[];

        if (updatedLines.length === 0) {
          return {
            ...currentCart,
            lines: [],
            totalQuantity: 0,
            cost: {
              ...currentCart.cost,
              totalAmount: { ...currentCart.cost.totalAmount, amount: "0" },
            },
          };
        }

        return {
          ...currentCart,
          ...updateCartTotals(updatedLines),
          lines: updatedLines,
        };
      });
    },
    [setCart],
  );

  const addCartItem = useCallback(
    (variant: ProductVariant, product: Product) => {
      setCart((currentCart) => {
        const existingItem = currentCart.lines.find(
          (item) => item.merchandise.id === variant.id,
        );
        const updatedItem = createOrUpdateCartItem(
          existingItem,
          variant,
          product,
        );

        const updatedLines = existingItem
          ? currentCart.lines.map((item) =>
              item.merchandise.id === variant.id ? updatedItem : item,
            )
          : [...currentCart.lines, updatedItem];

        return {
          ...currentCart,
          ...updateCartTotals(updatedLines),
          lines: updatedLines,
        };
      });
      trackAddToCart({
        content_ids: [variant.id || product.id],
        content_type: "product",
        value: Number(variant.price.amount),
        currency: variant.price.currencyCode,
        quantity: 1,
      });

      dispatchCartItemAdded();

    },
    [setCart],
  );

  const value = useMemo(
    () => ({
      cart,
      updateCartItem,
      addCartItem,
    }),
    [cart, updateCartItem, addCartItem],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
