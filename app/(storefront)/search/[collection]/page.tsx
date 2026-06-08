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
    <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-4">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: collection.title }]} />

      <div className="mb-6 flex items-center gap-2 border-b border-neutral-200 pb-3 dark:border-neutral-700 sm:gap-3">
        <h1 className="text-2xl font-bold">{collection.title}</h1>
        <div className="min-w-0 flex-1 sm:ml-auto sm:flex-none">
          <FilterList list={sorting} title="Sort by" horizontal />
        </div>
      </div>
      {products.length === 0 ? (
        <p className="py-3 text-lg">{`No products found in this collection`}</p>
      ) : (
        <>
          <Grid className="grid-cols-2 lg:grid-cols-6">
            <ProductGridItems products={products} />
          </Grid>
          <Pagination page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
