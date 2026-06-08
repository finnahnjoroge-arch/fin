import Grid from "components/grid";
import { GridTileImage } from "components/grid/tile";
import { Product } from "lib/sfcc/types";
import Link from "next/link";

export default function ProductGridItems({
  products,
}: {
  products: Product[];
}) {
  return (
    <>
      {products.map((product, index) => (
        <Grid.Item key={product.handle} className="animate-fadeIn h-full">
          <Link
            className="block h-full"
            href={`/product/${product.handle}`}
            prefetch={true}
          >
            <GridTileImage
              alt={product.title}
              label={{
                title: product.title,
                amountMin: product.priceRange.minVariantPrice.amount,
                amountMax: product.priceRange.maxVariantPrice.amount,
                currencyCode: product.currencyCode,
              }}
              src={product.featuredImage?.url}
              fill
              sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={index < 2}
            />
          </Link>
        </Grid.Item>
      ))}
    </>
  );
}
