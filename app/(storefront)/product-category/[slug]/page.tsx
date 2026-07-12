import { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "components/breadcrumbs";
import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import FilterList from "components/layout/search/filter";
import { Pagination } from "components/pagination";
import { getCollection } from "lib/storefront/categories";
import { sorting } from "lib/storefront/constants";
import { getCollectionProducts } from "lib/storefront/products";
import { baseUrl } from "lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  try {
    const collection = await getCollection(params.slug);
    if (!collection) return notFound();
    const collectionUrl = `${baseUrl}/product-category/${params.slug}`;
    return {
      title: collection.seo?.title || collection.title,
      description:
        collection.seo?.description ||
        collection.description ||
        `Shop ${collection.title} watches in Kenya. Browse our curated collection of authentic timepieces with fast delivery.`,
      alternates: {
        canonical: collectionUrl,
      },
      openGraph: {
        type: "website",
        title: collection.seo?.title || collection.title,
        description: collection.seo?.description || collection.description || `Shop ${collection.title} watches in Kenya.`,
        url: collectionUrl,
      },
      twitter: {
        card: "summary",
        title: collection.seo?.title || collection.title,
        description: collection.seo?.description || collection.description || `Shop ${collection.title} watches in Kenya.`,
      },
    };
  } catch {
    return { title: "Category" };
  }
}

export default async function ProductCategoryPage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const sort = (searchParams?.sort as string) || undefined;
  const pageParam = searchParams?.page;
  const page = typeof pageParam === "string" ? parseInt(pageParam, 10) || 1 : 1;

          const [collection, { products, totalPages }] = await Promise.all([
    getCollection(params.slug),
    getCollectionProducts({
      collection: params.slug,
      sortKey: sort,
      limit: 12,
      page,
    }),
  ]);

  if (!collection) return notFound();

  return (
    <>
      {/* Toolbar section with subtle background - compact version */}
      <div className="sticky-toolbar bg-gradient-to-b from-neutral-100/70 to-neutral-50 border-b border-neutral-200 shadow-lg">
        <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-1.5 sm:py-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="sm:hidden">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: collection?.title || "Category" }]} titleOnMobile />
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: collection?.title || "Category" }]} />
                <h1 className="truncate text-lg font-bold sm:text-2xl">{collection?.title || "Category"}</h1>
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
        {products.length === 0 ? (
          <p className="py-3 text-lg">{`No products found in this collection`}</p>
        ) : (
          <>
            <Grid className="mt-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
              <ProductGridItems products={products} />
            </Grid>
            <Pagination page={page} totalPages={totalPages} />
          </>
        )}
      </div>
    </>
  );
}

