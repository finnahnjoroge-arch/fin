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
    <div className="relative h-full w-full overflow-hidden rounded-sm bg-transparent shadow-sm sm:rounded-sm sm:shadow-md">
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
              sizes="(min-width: 1280px) 1280px, calc(100vw - 1.5rem)"
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
