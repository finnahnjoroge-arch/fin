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
      {/* Hero section with gradient background */}
      <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-b from-neutral-50 to-white pb-4 sm:pb-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-blue-100/60 to-indigo-50/40 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-amber-100/50 to-orange-50/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-(--breakpoint-2xl) px-4">
          <div className="pt-6 sm:pt-10">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
              {searchValue ? `Search Results` : "Search"}
            </h1>
            {searchValue ? (
              <p className="mt-2 text-sm text-neutral-500 sm:text-base">
                Showing results for &quot;<span className="font-medium text-neutral-700">{searchValue}</span>&quot;
              </p>
            ) : (
              <p className="mt-2 text-sm text-neutral-500 sm:text-base">
                Find the perfect timepiece
              </p>
            )}
          </div>

          {/* Toolbar card */}
          <div className="mt-6 rounded-xl border border-neutral-200 bg-gradient-to-r from-neutral-100/80 to-neutral-50/80 px-4 py-1.5 shadow-sm sm:px-6 sm:py-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
              <FilterList list={sorting} title="Sort by" horizontal />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-8 sm:pb-12">
        {/* Products section */}
        <div className="mt-6 sm:mt-8">
          {products.length > 0 ? (
            <>
              <div className="rounded-xl border border-neutral-100 bg-white p-2 shadow-sm sm:p-4">
                <Grid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
                  <ProductGridItems products={products} />
                </Grid>
              </div>
              <div className="mt-8 flex justify-center">
                <Pagination page={page} totalPages={totalPages} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 px-6 py-16 text-center">
              <div className="mb-3 text-4xl">🔍</div>
              <h3 className="text-lg font-semibold text-neutral-800">No products found</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Try a different search term or browse our categories
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

