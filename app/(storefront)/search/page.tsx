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
    <>
      {/* Toolbar section with subtle background - compact version */}

      <div className="sticky-toolbar bg-gradient-to-b from-neutral-100/70 to-neutral-50 border-b border-neutral-200 shadow-lg">
        <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-1.5 sm:py-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="sm:hidden">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search Results" }]} titleOnMobile />
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search Results" }]} />
                <h1 className="truncate text-lg font-bold sm:text-2xl">Search Results</h1>
              </div>
            </div>
            <div className="flex-none">
              <FilterList list={sorting} title="Sort by" horizontal />
            </div>
          </div>
        </div>
      </div>

      {/* Products section */}
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-4">
        {products.length > 0 ? (
          <>
            <Grid className="mt-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
              <ProductGridItems products={products} />
            </Grid>
            <Pagination page={page} totalPages={totalPages} />
          </>
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 px-6 py-16 text-center">
            <div className="mb-3 text-4xl">🔍</div>
            <h3 className="text-lg font-semibold text-neutral-800">No products found</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Try a different search term or browse our categories
            </p>
          </div>
        )}
      </div>
    </>
  );
}
