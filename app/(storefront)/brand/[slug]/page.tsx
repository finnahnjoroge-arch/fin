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
    <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-4 text-black dark:text-white">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: brand.name }]} />

      <div className="mb-6 flex items-end gap-2 border-b border-neutral-100 pb-4 sm:gap-3">
        <BrandCollections collections={collections} />
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
      ) : (
        <p className="text-neutral-500">No products found for this brand.</p>
      )}
    </div>
  );
}
