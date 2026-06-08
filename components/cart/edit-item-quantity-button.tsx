"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { CartItem } from "lib/sfcc/types";

type UpdateType = "plus" | "minus";

function SubmitButton({ type, onClick }: { type: UpdateType; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        type === "plus" ? "Increase item quantity" : "Reduce item quantity"
      }
      className={clsx(
        "ease flex h-full min-w-[30px] max-w-[30px] flex-none items-center justify-center rounded-full border border-neutral-300 bg-white p-1 transition-all duration-200 hover:border-neutral-500 hover:bg-neutral-50",
        {
          "ml-auto": type === "minus",
        },
      )}
    >
      {type === "plus" ? (
        <PlusIcon className="h-3 w-3 text-neutral-600" />
      ) : (
        <MinusIcon className="h-3 w-3 text-neutral-600" />
      )}
    </button>
  );
}

export function EditItemQuantityButton({
  item,
  type,
  optimisticUpdate,
}: {
  item: CartItem;
  type: UpdateType;
  optimisticUpdate: (merchandiseId: string, updateType: UpdateType) => void;
}) {
  const merchandiseId = item.merchandise.id;

  return (
    <SubmitButton
      type={type}
      onClick={() => optimisticUpdate(merchandiseId, type)}
    />
  );
}
