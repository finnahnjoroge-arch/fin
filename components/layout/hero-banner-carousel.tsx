"use client";

import { getCloudinaryUrl } from "lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

type HeroBannerCarouselProps = {
  images: string[];
  interval: 3000 | 5000;
};

/**
 * Cloudinary image loader used to generate a responsive `srcSet` from the
 * `sizes` prop. For Cloudinary URLs it injects width + auto format/quality
 * transformations, e.g. `w_800,f_auto,q_auto` for mobile and
 * `w_1400,f_auto,q_auto` for desktop. Non-Cloudinary URLs are returned as-is.
 */
function cloudinaryLoader({ src, width }: { src: string; width: number }): string {
  return getCloudinaryUrl(src, { width });
}

export function HeroBannerCarousel({ images, interval }: HeroBannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [images.length, interval]);

  if (images.length === 0) return null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-transparent shadow-sm sm:rounded-sm sm:shadow-md">
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {images.map((src, index) => (
          <div key={`${src}-${index}`} className="relative h-full w-full shrink-0">
            <Image
              src={src}
              alt={`Hero banner ${index + 1}`}
              fill
              className="object-cover object-center"
              loader={cloudinaryLoader}
              // Mobile devices download a smaller rendition (max ~800px wide),
              // while desktop downloads the full-size (max 1400px) image.
              sizes="(max-width: 768px) 100vw, 1400px"
              // The custom Cloudinary loader returns fully-optimized URLs, so we
              // opt out of the global unoptimized flag for this image to let
              // Next.js generate the responsive srcSet from the loader + sizes.
              unoptimized={false}
              quality={100}
              priority={index === 0}
            />
          </div>
        ))}
      </div>
      {images.length > 1 ? (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:bottom-4 sm:gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show banner ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-all sm:h-2 ${
                index === activeIndex ? "w-6 bg-white sm:w-8" : "w-1.5 bg-white/60 sm:w-2"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

