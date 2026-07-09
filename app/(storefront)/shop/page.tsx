import { Breadcrumbs } from "components/breadcrumbs";
import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import Collections from "components/layout/search/collections";
import FilterList from "components/layout/search/filter";
import { Pagination } from "components/pagination";
import { sorting } from "lib/storefront/constants";
import { getProducts } from "lib/storefront/products";
import { getStoreSettings } from "lib/storefront/settings";
import { baseUrl } from "lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = await getStoreSettings();
  const title = settings.shopMetaTitle || "Shop All Watches in Kenya | Browse Premium Timepieces";
  const description = settings.shopMetaDescription || "Browse our full catalog of watches in Kenya. Luxury, sports, and everyday timepieces from top brands with fast delivery across Nairobi and nationwide.";

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/shop`,
    },
    openGraph: {
      type: "website",
      title,
      description: settings.shopMetaDescription || "Browse our full catalog of watches in Kenya.",
      url: `${baseUrl}/shop`,
    },
    twitter: {
      card: "summary",
      title,
      description: settings.shopMetaDescription || "Browse our full catalog of watches in Kenya.",
    },
  };
}

const DEFAULT_CATEGORY = "mens-watch";

export default async function ShopPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const searchValue = (searchParams?.q as string) || "";
  const sort = (searchParams?.sort as string) || undefined;
  const pageParam = searchParams?.page;
  const page = typeof pageParam === "string" ? parseInt(pageParam, 10) || 1 : 1;

  const [settings, { products, totalPages }] = await Promise.all([
    getStoreSettings(),
    getProducts({
      search: searchValue,
      category: DEFAULT_CATEGORY,
      sort,
      limit: 12,
      page,
    }),
  ]);
  const resultsText = products.length > 1 ? "results" : "result";

  return (
    <>
      {/* Hero header section */}
      <div className="relative bg-gradient-to-b from-neutral-50 to-white">
        {/* Decorative background circles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-blue-100/60 to-indigo-50/40 blur-3xl sm:h-72 sm:w-72" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-amber-100/40 to-orange-50/30 blur-3xl sm:h-80 sm:w-80" />
        </div>

        <div className="relative mx-auto max-w-(--breakpoint-2xl) px-4 pb-6 sm:pb-8">
          {/* Title area */}
          <div className="pt-6 sm:pt-10">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
              Shop All Watches
            </h1>
            <p className="mt-2 max-w-xl text-sm text-neutral-500 sm:text-base">
              Browse our complete collection of premium timepieces — from luxury to everyday wear
            </p>
          </div>

          {/* Toolbar card */}
          <div className="mt-6 rounded-xl border border-neutral-200 bg-gradient-to-r from-neutral-100/80 to-neutral-50/80 px-4 py-1.5 shadow-sm sm:px-6 sm:py-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
              </div>
              <div className="hidden sm:block">
                <span className="text-neutral-300">|</span>
              </div>
              <Collections horizontal defaultPath="/product-category/mens-watch" />
              <div className="ml-auto">
                <FilterList list={sorting} title="Sort by" horizontal />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-12 sm:pb-16">
        {/* Search banner */}
        {searchValue ? (
          <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3">
            <p className="text-sm text-blue-800">
              {products.length === 0
                ? "There are no products that match "
                : `Showing ${products.length} ${resultsText} for `}
              <span className="font-bold">&quot;{searchValue}&quot;</span>
            </p>
          </div>
        ) : null}

        {/* Products */}
        {products.length > 0 ? (
          <>
            <div className="mt-6 rounded-xl border border-neutral-100 bg-white p-2 shadow-sm sm:mt-8 sm:p-4">
              <Grid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
                <ProductGridItems products={products} />
              </Grid>
            </div>
            <div className="mt-8 flex justify-center">
              <Pagination page={page} totalPages={totalPages} />
            </div>
          </>
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 px-6 py-16 text-center sm:mt-8">
            <div className="mb-3 text-4xl">🔍</div>
            <h3 className="text-lg font-semibold text-neutral-800">No products found</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

    </>
  );
}
