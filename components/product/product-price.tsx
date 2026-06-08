import Price from "components/price";
import { Product } from "lib/sfcc/types";

export function ProductPrice({ product }: { product: Product }) {
  const variant = product.variants && product.variants.length > 0
    ? product.variants.find((v) => v.title === product.defaultVariant) || product.variants[0]
    : undefined;

  const price = variant?.price?.amount || product.priceRange?.minVariantPrice?.amount || undefined;
  const compare = product.comparePrice?.amount;

  const priceNum = price ? parseFloat(price) : undefined;
  const compareNum = compare ? parseFloat(compare) : undefined;
  const isDiscount = priceNum !== undefined && compareNum !== undefined && compareNum > priceNum;
  const percentOff = isDiscount ? Math.round((1 - priceNum! / compareNum!) * 100) : 0;
  // removed saveAmount display per request
  const saveAmount = isDiscount ? (compareNum! - priceNum!) : 0;

  return (
    <div className="flex items-baseline gap-3 min-w-0">
      {price ? (
        <div className="flex-shrink-0">
          <Price amount={price} className="text-2xl font-semibold text-blue-600 md:text-3xl" currencyCode={product.currencyCode} />
        </div>
      ) : null}

      {isDiscount ? (
        <div className="flex items-baseline gap-2 min-w-0">
          <div className="flex-shrink-0">
            <Price amount={compare} className="text-sm text-neutral-500 line-through" currencyCode={product.currencyCode} />
          </div>

          <span className="inline-flex items-center rounded-full bg-green-50 text-green-600 px-2 py-0.5 text-xs font-semibold flex-shrink-0">-{percentOff}%</span>
        </div>
      ) : null}
    </div>
  );
}

