import { Breadcrumbs } from "components/breadcrumbs";
import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import FilterList from "components/layout/search/filter";
import { Pagination } from "components/pagination";
import { sorting } from "lib/storefront/constants";
import { getProducts } from "lib/storefront/products";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search",
  description: "Search for products in the store.",
};

export default async function SearchPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { q: searchValue, sort, page: pageParam } = searchParams as { [key: string]: string };
  const page = pageParam ? parseInt(pageParam, 10) || 1 : 1;

  const { products, totalPages } = await getProducts({ search: searchValue, sort, limit: 12, page });
  const resultsText = products.length > 1 ? "results" : "result";

  return (
    <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-4">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />

      <div className="mb-6 flex items-center gap-2 border-b border-neutral-200 py-3 sm:gap-3">
        {searchValue ? (
          <p className="text-sm text-neutral-900">
            {products.length === 0
              ? "There are no products that match "
              : `Showing ${products.length} ${resultsText} for `}
            <span className="font-bold">&quot;{searchValue}&quot;</span>
          </p>
        ) : (
          <h1 className="text-2xl font-bold text-neutral-900">Search</h1>
        )}
        <div className="min-w-0 flex-1 sm:ml-auto sm:flex-none">
          <FilterList list={sorting} title="Sort by" horizontal />
        </div>
      </div>
      {products.length > 0 ? (
        <>
          <Grid className="grid-cols-2 lg:grid-cols-6">
            <ProductGridItems products={products} />
          </Grid>
          <Pagination page={page} totalPages={totalPages} />
        </>
      ) : null}
    </div>
  );
}
