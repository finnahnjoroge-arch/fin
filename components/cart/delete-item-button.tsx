"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { CartItem } from "lib/sfcc/types";

export function DeleteItemButton({
  item,
  optimisticUpdate,
}: {
  item: CartItem;
  optimisticUpdate: (merchandiseId: string, updateType: "delete") => void;
}) {
  const merchandiseId = item.merchandise.id;

  return (
    <button
      type="button"
      aria-label="Remove cart item"
      className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-neutral-400 hover:bg-neutral-600 transition-colors"
      onClick={() => optimisticUpdate(merchandiseId, "delete")}
    >
      <XMarkIcon className="mx-[1px] h-3 w-3 text-white" />
    </button>
  );
}
