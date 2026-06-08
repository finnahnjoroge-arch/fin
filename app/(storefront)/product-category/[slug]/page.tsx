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

  return (
    <>
      <div className="mb-6 flex min-w-0 items-end gap-2 border-b border-neutral-100 pb-4 sm:items-center sm:gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: collection?.title || "Category" }]} />
          <h1 className="truncate text-xl font-bold text-neutral-900 sm:text-2xl">{collection?.title || "Category"}</h1>
        </div>
        <div className="flex-none">
          <FilterList list={sorting} title="Sort by" horizontal />
        </div>
      </div>
      {products.length === 0 ? (
        <p className="py-3 text-lg text-neutral-900">{`No products found in this category`}</p>
      ) : (
        <>

          <Grid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
            <ProductGridItems products={products} />
          </Grid>
          <Pagination page={page} totalPages={totalPages} />
        </>
      )}
    </>
  );
}
