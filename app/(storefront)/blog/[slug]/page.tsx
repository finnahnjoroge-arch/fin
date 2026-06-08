import Prose from "@/components/prose";
import { getBlogPost } from "@/lib/storefront/blogs";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return notFound();
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.featuredImage ? [post.featuredImage] : undefined,
      type: "article",
      publishedTime: post.publishedAt?.toString(),
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return notFound();

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-sm uppercase tracking-wide text-neutral-500">{new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", day: "numeric" }).format(new Date(post.publishedAt || post.createdAt))}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{post.title}</h1>
        {post.excerpt ? <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">{post.excerpt}</p> : null}
      </div>
      {post.featuredImage ? (
        <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900">
          <img src={post.featuredImage} alt={post.title} className="h-full w-full object-cover" />
        </div>
      ) : null}
      <Prose className="max-w-none" html={post.content} />
    </article>
  );
}
