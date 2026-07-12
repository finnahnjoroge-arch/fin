import { Breadcrumbs } from "components/breadcrumbs";
import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import BrandCollections from "components/layout/search/brand-collections";
import FilterList from "components/layout/search/filter";
import { Pagination } from "components/pagination";
import { getBrandBySlug } from "lib/storefront/brands";
import { getCollections } from "lib/storefront/categories";
import { sorting } from "lib/storefront/constants";
import { getProducts } from "lib/storefront/products";
import { baseUrl } from "lib/utils";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const brand = await getBrandBySlug(params.slug);
  const brandName = brand?.name || params.slug;
  const brandUrl = `${baseUrl}/brand/${params.slug}`;
  return {
    title: `${brandName} Watches in Kenya | Shop Authentic Timepieces`,
    description: `Shop authentic ${brandName} watches in Kenya. Explore the latest collection with best prices and fast delivery across Nairobi and nationwide.`,
    alternates: {
      canonical: brandUrl,
    },
    openGraph: {
      type: "website",
      title: `${brandName} Watches in Kenya`,
      description: `Shop authentic ${brandName} watches in Kenya.`,
      url: brandUrl,
    },
    twitter: {
      card: "summary",
      title: `${brandName} Watches in Kenya`,
      description: `Shop authentic ${brandName} watches in Kenya.`,
    },
  };
}

export default async function BrandPage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const category = searchParams?.category as string | undefined;
  const sort = searchParams?.sort as string | undefined;
  const pageParam = searchParams?.page;
  const page = typeof pageParam === "string" ? parseInt(pageParam, 10) || 1 : 1;

      const brand = await getBrandBySlug(params.slug);
  if (!brand) notFound();

  const [collections, { products, totalPages }] = await Promise.all([
    getCollections(),
    getProducts({ brand: params.slug, category, sort, limit: 12, page }),
  ]);

    return (
    <>
      {/* Toolbar section with subtle background - compact version */}
      <div className="bg-gradient-to-b from-neutral-100/70 to-neutral-50 border-b border-neutral-200">
        <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-1.5 sm:py-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="sm:hidden">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: brand.name }]} titleOnMobile />
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: brand.name }]} />
                <h1 className="truncate text-lg font-bold sm:text-2xl">{brand.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BrandCollections collections={collections} />
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
          <p className="mt-4 text-neutral-500">No products found for this brand.</p>
        )}
      </div>
    </>
  );
}

