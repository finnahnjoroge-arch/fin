"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useProduct, useUpdateURL } from "components/product/product-context";
import Image from "next/image";
export function Gallery({
  images,
}: {
  images: { src: string; altText: string }[];
}) {
  const { state, updateImage } = useProduct();
  const updateURL = useUpdateURL();
  const imageIndex = state.image ? parseInt(state.image) : 0;
    // Defensive: tolerate missing/empty image arrays (e.g. products with no media).
  const safeImages = images || [];
  const safeImageIndex =
    !Number.isNaN(imageIndex) && imageIndex >= 0 && imageIndex < safeImages.length
      ? imageIndex
      : 0;

  const nextImageIndex =
    safeImageIndex + 1 < safeImages.length ? safeImageIndex + 1 : 0;
  const previousImageIndex =
    safeImageIndex === 0 ? safeImages.length - 1 : safeImageIndex - 1;

  const buttonClassName =
    "flex h-full items-center justify-center px-5 text-neutral-700 transition-all ease-in-out hover:scale-110 hover:text-black md:px-6";

  return (
    <form className="flex flex-col w-full">
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-50 lg:aspect-square">
                {safeImages[safeImageIndex] && (
          <Image
            className="h-full w-full object-cover"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            alt={safeImages[safeImageIndex]?.altText as string}
            src={safeImages[safeImageIndex]?.src as string}
            priority={true}
            unoptimized
          />
        )}

        {safeImages.length > 1 ? (
          <div className="absolute bottom-3 flex w-full justify-center md:bottom-[15%]">
            <div className="mx-auto flex h-10 items-center rounded-full border border-neutral-200 bg-white/90 text-neutral-900 shadow-lg backdrop-blur-sm md:h-11">
              <button
                formAction={() => {
                  const newState = updateImage(previousImageIndex.toString());
                  updateURL(newState);
                }}
                aria-label="Previous product image"
                className={buttonClassName}
              >
                <ArrowLeftIcon className="h-5" />
              </button>
              <div className="mx-1 h-6 w-px bg-neutral-300"></div>
              <button
                formAction={() => {
                  const newState = updateImage(nextImageIndex.toString());
                  updateURL(newState);
                }}
                aria-label="Next product image"
                className={buttonClassName}
              >
                <ArrowRightIcon className="h-5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </form>
  );
}

