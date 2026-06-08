import type { Metadata } from "next";

import Prose from "components/prose";
import { getPage } from "lib/storefront/content";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = await getPage(params.page);

  if (!page) return notFound();

  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description || page.bodySummary,
    openGraph: {
      publishedTime: page.createdAt,
      modifiedTime: page.updatedAt,
      type: "article",
    },
  };
}

export default async function Page(props: {
  params: Promise<{ page: string }>;
}) {
  const params = await props.params;
  const page = await getPage(params.page);

  if (!page) return notFound();

  return (
    <div className="mx-auto max-w-5xl px-1 py-1 sm:px-2 sm:py-2">
      <article className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm sm:rounded-xl">
        <div className="px-3 py-4 sm:px-5 sm:py-6 md:px-8 md:py-8">
          <header className="mb-3 border-b border-neutral-100 pb-3 sm:mb-4 sm:pb-4">
            <h1 className="text-lg font-bold tracking-tight text-neutral-900 sm:text-xl md:text-2xl">
              {page.title}
            </h1>
            <p className="mt-0.5 text-xs font-medium text-neutral-400 sm:mt-1 sm:text-sm">
              Last updated on{" "}
              {new Intl.DateTimeFormat(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              }).format(new Date(page.updatedAt))}
            </p>
          </header>

          <Prose className="max-w-none" html={page.body} />
        </div>
      </article>
    </div>
  );
}
