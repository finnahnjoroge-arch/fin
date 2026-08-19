"use client";

import dynamic from "next/dynamic";
import type { Product } from "lib/sfcc/types";

type CategorySummary = {
  slug: string;
  title: string;
  emoji?: string;
  image?: string;
  children?: { slug: string; title: string; path: string }[];
};

type CategorySectionData = {
  slug: string;
  name: string;
  description?: string;
};

type SectionInitialData = Record<
  string,
  { products: Product[]; total: number; page: number; totalPages: number }
>;

interface HomepageLazySectionsProps {
  categories: CategorySummary[];
  sections: CategorySectionData[];
  initialData: SectionInitialData;
  brands: Array<{
    _id: string;
    name: string;
    slug: string;
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

// These components render below the hero banner. They are lazily loaded on the
// client only so they don't block the initial mobile render.
const CategoryCircles = dynamic(
  () => import("./category-circles").then((m) => m.CategoryCircles),
  { ssr: false, loading: () => null },
);

const CategorySections = dynamic(() => import("./category-sections"), {
  ssr: false,
  loading: () => null,
});

const BrandCarousel = dynamic(
  () => import("./brand-carousel").then((m) => m.BrandCarousel),
  { ssr: false, loading: () => null },
);

export function HomepageLazySections({
  categories,
  sections,
  initialData,
  brands,
}: HomepageLazySectionsProps) {
  return (
    <>
      <CategoryCircles categories={categories} />
      <CategorySections categories={sections} initialData={initialData} />
      {brands.length > 0 ? <BrandCarousel brands={brands} /> : null}
    </>
  );
}