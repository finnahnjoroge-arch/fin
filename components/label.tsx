import clsx from "clsx";
import { ReactNode } from "react";
import Price from "./price";

const Label = ({
  title,
  amountMin,
  amountMax,
  currencyCode,
  comparePrice,
  position = "bottom",
  actions,
}: {
  title: string;
  amountMin: string;
  amountMax: string;
  currencyCode: string;
  comparePrice?: string;
  position?: "bottom" | "center";
  actions?: ReactNode;
}) => {
  const isRangePrice = amountMin !== amountMax;
    const hasComparePrice = comparePrice && parseFloat(comparePrice) > parseFloat(amountMin);

  return (
    <div
      className={clsx(
        "flex w-full flex-col bg-white px-2 pb-2 pt-2 sm:px-3 sm:pt-2",
      )}
    >
      {/* Product name - clearly visible */}
      <h3 className="line-clamp-2 text-xs font-medium leading-snug text-neutral-700 sm:text-sm">
        {title}
      </h3>
            {/* Price row */}
      <div className="mt-1 flex flex-col gap-0">
        {hasComparePrice && (
          <span className="text-xs text-neutral-400 line-through sm:text-sm">
            <Price
              className="text-xs text-neutral-400 line-through sm:text-sm"
              amount={comparePrice!}
              currencyCode={currencyCode}
            />
          </span>
        )}
        <Price
          className="text-base font-bold text-neutral-900 sm:text-lg"
          amount={amountMin}
          prefix={isRangePrice ? "From " : ""}
          currencyCode={currencyCode}
        />
      </div>
      {actions && (
        <div className="mt-2 -mx-3 flex items-stretch divide-x divide-white/30 overflow-hidden rounded-b-2xl sm:-mx-4">
          {actions}
        </div>
      )}
    </div>
  );
};

export default Label;
