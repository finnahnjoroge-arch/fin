import { Breadcrumbs } from "components/breadcrumbs";
import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import Collections from "components/layout/search/collections";
import { Pagination } from "components/pagination";
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
      sort,
      limit: 12,
      page,
    }),
  ]);
  const resultsText = products.length > 1 ? "results" : "result";

  return (
    <>
      {/* Toolbar section with subtle background - compact version */}
      <div className="bg-gradient-to-b from-neutral-100/70 to-neutral-50 border-b border-neutral-200">
        <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-1.5 sm:py-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="sm:hidden">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} titleOnMobile />
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
                <h1 className="truncate text-lg font-bold sm:text-2xl">Shop</h1>
              </div>
            </div>
            <div className="flex-none">
              <Collections horizontal defaultPath="/shop" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-4">
        {/* Search banner */}
        {searchValue ? (
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3">
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
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </>
  );
}
