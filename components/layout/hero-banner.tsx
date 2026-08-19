import { getStoreSettings } from "lib/storefront/settings";
import { getCloudinaryUrl } from "lib/utils";
import Image from "next/image";
import Link from "next/link";

export async function HeroBanner() {
  const settings = await getStoreSettings();

  if (!settings.heroEnabled) {
    return null;
  }

  const bgColor = settings.heroBgColor || "#f5f5dc";
  const primaryColor = settings.primaryColor || "#2563eb";

        if (settings.heroMode === "image") {
    const rawImages = settings.heroImageUrls.length
      ? settings.heroImageUrls
      : settings.heroImageUrl
        ? [settings.heroImageUrl]
        : [];
    // Serve a single static, best-performing hero image. The Cloudinary URL is
    // pre-optimized server-side (f_auto, q_auto, w_1400) so it's served
    // directly on the edge (OpenNext/Cloudflare, no Next image optimizer).
    // Only the first image is used - all carousel/slider logic is removed.
    const heroImageUrl = rawImages[0] ? getCloudinaryUrl(rawImages[0], { width: 1400 }) : "";
    if (!heroImageUrl) return null;

    const img = (
      <div className="relative h-full w-full overflow-hidden bg-transparent shadow-sm sm:rounded-sm sm:shadow-md">
        <Image
          src={heroImageUrl}
          alt={settings.heroTitle || "Hero banner"}
          fill
          priority={true}
          fetchPriority="high"
          quality={85}
          sizes="(max-width: 768px) 100vw, 1400px"
          className="object-cover object-center"
          unoptimized
        />
        {/* overlay text */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/40 via-black/10 to-black/30" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-5 py-8 text-center sm:gap-5 sm:px-8 sm:py-14 md:px-10 md:py-18">
          {settings.heroTitle ? (
            <h2 className="text-xl font-bold leading-snug text-white sm:text-3xl md:text-4xl">
              {settings.heroTitle}
            </h2>
          ) : null}
          {settings.heroSubtitle ? (
            <p className="text-sm font-medium text-white/90 sm:text-lg">
              {settings.heroSubtitle}
            </p>
          ) : null}
          {settings.heroButtonLink ? (
            <Link
              href={settings.heroButtonLink}
              className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 sm:px-10 sm:py-3.5 sm:text-base"
              style={{ backgroundColor: primaryColor }}
            >
              {settings.heroButtonText || "Shop Now"}
            </Link>
          ) : null}
        </div>
      </div>
    );

        // The overlay above renders the CTA button link, so the whole image is a
    // static (non-navigating) hero with consistent layout dimensions.
    return <div className="aspect-[16/9] w-full sm:h-[280px] sm:aspect-auto lg:h-[392px]">{img}</div>;
  }

  if (!settings.heroTitle) return null;

  return (
    <section className="aspect-[16/9] sm:h-[280px] sm:aspect-auto lg:h-[392px]">
      <div
        className="relative flex h-full flex-col items-center justify-center overflow-hidden sm:rounded-sm px-5 py-8 text-center sm:px-8 sm:py-14 md:px-10 md:py-18"
        style={{ backgroundColor: bgColor }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/10" />

        <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-5">
          <h2 className="text-xl font-bold leading-snug sm:text-3xl md:text-4xl" style={{ color: "#0f172a" }}>
            {settings.heroTitle}
          </h2>
          {settings.heroSubtitle ? (
            <p className="text-sm font-medium sm:text-lg" style={{ color: "#334155" }}>
              {settings.heroSubtitle}
            </p>
          ) : null}
          {settings.heroButtonLink ? (
            <Link
              href={settings.heroButtonLink}
              className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 sm:px-10 sm:py-3.5 sm:text-base"
              style={{ backgroundColor: primaryColor }}
            >
              {settings.heroButtonText || "Shop Now"}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

