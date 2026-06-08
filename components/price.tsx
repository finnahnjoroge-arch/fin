const formatPrice = (amount: string, currencyCode: string) => {
  const num = parseFloat(amount);
  const formatted = new Intl.NumberFormat("en-KE", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
  return `${currencyCode} ${formatted}`;
};

const Price = ({
  amount,
  minAmount,
  maxAmount,
  prefix,
  className,
  currencyCode = "KES",
}: {
  amount?: string;
  minAmount?: string;
  maxAmount?: string;
  prefix?: string;
  className?: string;
  currencyCode: string;
} & React.ComponentProps<"p">) => {
  let priceDisplay: string | null = null;

  if (minAmount && maxAmount && minAmount !== maxAmount) {
    priceDisplay = `${formatPrice(minAmount, currencyCode)} - ${formatPrice(maxAmount, currencyCode)}`;
  } else if (amount || minAmount || maxAmount) {
    priceDisplay = formatPrice(
      amount || minAmount || maxAmount || "9999.99",
      currencyCode,
    );
  }

  if (!priceDisplay) {
    return null;
  }

  return (
    <p suppressHydrationWarning={true} className={className}>
      {prefix ? `${prefix} ` : ""}
      {priceDisplay}
    </p>
  );
};

export default Price;
