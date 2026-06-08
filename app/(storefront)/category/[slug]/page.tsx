import { Breadcrumbs } from "components/breadcrumbs";
import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import FilterList from "components/layout/search/filter";
import { StickyWhatsAppButton } from "components/layout/sticky-whatsapp-button";
import { Pagination } from "components/pagination";
import { getCategoryBySlug } from "lib/storefront/categories";
import { sorting } from "lib/storefront/constants";
import { getProducts } from "lib/storefront/products";
import { getStoreSettings } from "lib/storefront/settings";
import { baseUrl } from "lib/utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  try {
    const category = await getCategoryBySlug(params.slug);
    if (!category) return notFound();
    const categoryUrl = `${baseUrl}/category/${params.slug}`;
    return {
      title: category.seo?.title || category.title,
      description: category.seo?.description || category.description || `Shop ${category.title} watches in Kenya. Browse our collection of authentic timepieces with fast delivery.`,
      alternates: {
        canonical: categoryUrl,
      },
      openGraph: {
        type: "website",
        title: category.seo?.title || category.title,
        description: category.seo?.description || category.description || `Shop ${category.title} watches in Kenya.`,
        url: categoryUrl,
      },
      twitter: {
        card: "summary",
        title: category.seo?.title || category.title,
        description: category.seo?.description || category.description || `Shop ${category.title} watches in Kenya.`,
      },
    };
  } catch {
    return { title: "Category" };
  }
}

export default async function CategoryPage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const pageParam = searchParams?.page;
  const page = typeof pageParam === "string" ? parseInt(pageParam, 10) || 1 : 1;
  const sort = (searchParams?.sort as string) || undefined;

  try {
    const [settings, category] = await Promise.all([
      getStoreSettings(),
      getCategoryBySlug(params.slug),
    ]);
    if (!category) return notFound();

    const { products, totalPages } = await getProducts({
      category: params.slug,
      sort,
      limit: 12,
      page,
    });

    return (
      <>
        <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-4">
          <div className="mb-3 flex min-w-0 items-end gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-700 sm:mb-6 sm:items-center sm:gap-3 sm:pb-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
              <div className="sm:-mb-0.5 sm:-mt-1">
                <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: category.title }]} />
              </div>
              <h1 className="truncate text-lg font-bold sm:text-2xl">{category.title}</h1>
            </div>
            <div className="flex-none">
              <FilterList list={sorting} title="Sort by" horizontal />
            </div>
          </div>
          {products.length === 0 ? (
            <p className="py-3 text-lg">No products found in this category.</p>
          ) : (
            <>
              <Grid className="grid-cols-2 lg:grid-cols-6">
                <ProductGridItems products={products} />
              </Grid>
              <Pagination page={page} totalPages={totalPages} />
            </>
          )}
        </div>
        <StickyWhatsAppButton
          phone={settings.whatsappPhone || settings.storePhone}
          message="Hi, I'm browsing a category and have a question."
        />
      </>
    );
  } catch {
    return notFound();
  }
}
