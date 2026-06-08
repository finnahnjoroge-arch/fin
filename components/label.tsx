import clsx from "clsx";
import Price from "./price";

const Label = ({
  title,
  amountMin,
  amountMax,
  currencyCode,
  position = "bottom",
}: {
  title: string;
  amountMin: string;
  amountMax: string;
  currencyCode: string;
  position?: "bottom" | "center";
}) => {
  const isRangePrice = amountMin !== amountMax;
  return (
    <div
      className={clsx(
        "w-full bg-[#f7f7f7] px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3",
      )}
    >
      {/* Product name - clearly visible */}
      <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-neutral-800 sm:text-base">
        {title}
      </h3>
      {/* Price - prominent and easy to scan */}
      <Price
        className="mt-1 text-base font-bold text-blue-600 sm:text-lg"
        amount={amountMin}
        prefix={isRangePrice ? "From " : ""}
        currencyCode={currencyCode}
      />
    </div>
  );
};

export default Label;
