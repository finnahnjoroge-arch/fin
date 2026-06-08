import { CategoriesSidebar } from "./categories-sidebar";
import { HeroBanner } from "./hero-banner";
import { StoreFeatures } from "./store-features";

export function HeroSection({
  categories,
}: {
  categories: {
    slug: string;
    title: string;
    emoji?: string;
    image?: string;
    children?: { slug: string; title: string; path: string }[];
  }[];
}) {
  return (
    <section className="w-full" style={{ backgroundColor: "#E1F3FF" }}>
      <div className="mx-auto hidden max-w-7xl px-4 py-6 lg:block lg:px-6">
        <div className="grid grid-cols-[220px_minmax(0,1fr)_240px] items-stretch gap-4">
          <CategoriesSidebar categories={categories} />
          <div className="min-w-0">
            <HeroBanner />
          </div>
          <StoreFeatures />
        </div>
      </div>

      <div className="lg:hidden">
        <div className="mx-auto max-w-7xl px-3 pt-3 pb-2">
          <HeroBanner />
        </div>
      </div>
    </section>
  );
}
