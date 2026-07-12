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

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  try {
    const collection = await getCollection(params.collection);
    if (!collection) return notFound();
    return {
      title: collection.seo?.title || collection.title,
      description:
        collection.seo?.description ||
        collection.description ||
        `${collection.title} products`,
    };
  } catch {
    return { title: "Collection" };
  }
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const pageParam = searchParams?.page;
  const page = typeof pageParam === "string" ? parseInt(pageParam, 10) || 1 : 1;
  const sort = (searchParams?.sort as string) || undefined;
  const { products, totalPages } = await getCollectionProducts({
    collection: params.collection,
    sortKey: sort,
    limit: 12,
    page,
  });

  const collection = await getCollection(params.collection);
  if (!collection) return notFound();

  return (
    <>
      {/* Toolbar section with subtle background - compact version */}
      <div className="sticky-toolbar bg-gradient-to-b from-neutral-100/70 to-neutral-50 border-b border-neutral-200 shadow-lg">
        <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-1.5 sm:py-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="sm:hidden">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: collection.title }]} titleOnMobile />
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: collection.title }]} />
                <h1 className="truncate text-lg font-bold sm:text-2xl">{collection.title}</h1>
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

