"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type HeroBannerCarouselProps = {
  images: string[];
  interval: 3000 | 5000;
};

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
            {/* The URL is already Cloudinary-optimized server-side (width +
                f_auto + q_auto). This site runs unoptimized on the edge
                (OpenNext/Cloudflare) without a Next image optimizer, so the
                Cloudinary URL is served directly. Only the visible slide is
                eagerly loaded; the rest are lazy/priority-less. */}
            <Image
              src={src}
              alt={`Hero banner ${index + 1}`}
              fill
              className="object-cover object-center"
              unoptimized
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

