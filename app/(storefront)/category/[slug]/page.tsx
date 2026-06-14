import { Breadcrumbs } from "components/breadcrumbs";
import Grid from "components/grid";
import ProductGridItems from "components/layout/product-grid-items";
import FilterList from "components/layout/search/filter";
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
        {/* Toolbar section with subtle background */}
        <div className="bg-gradient-to-b from-neutral-100/70 to-neutral-50 border-b border-neutral-200">
          <div className="mx-auto max-w-(--breakpoint-2xl) px-4 py-1.5 sm:py-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="sm:hidden">
                  <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: category.title }]} titleOnMobile />
                </div>
                <div className="hidden items-center gap-3 sm:flex">
                  <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: category.title }]} />
                  <h1 className="truncate text-lg font-bold sm:text-2xl">{category.title}</h1>
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
            <p className="py-3 text-lg">No products found in this category.</p>
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
  } catch {
    return notFound();
  }
}

