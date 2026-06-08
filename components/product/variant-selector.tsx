"use client";

import clsx from "clsx";
import { useProduct, useUpdateURL } from "components/product/product-context";
import { Image, ProductOption, ProductVariant } from "lib/sfcc/types";
import { startTransition, useEffect } from "react";

type Combination = {
  id: string;
  availableForSale: boolean;
  [key: string]: string | boolean;
};

export function VariantSelector({
  options,
  variants,
  images,
  defaultVariant,
}: {
  options: ProductOption[];
  variants: ProductVariant[];
  images: Image[];
  defaultVariant?: string;
}) {
  const { state, updateOption, updateImage } = useProduct();
  const updateURL = useUpdateURL();
  const hasNoOptionsOrJustOneOption =
    !options.length ||
    (options.length === 1 && options[0]?.values.length === 1);

  useEffect(() => {
    const urlParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const hasUrlOptionParams =
      urlParams &&
      options.some((option) => urlParams.get(option.name.toLowerCase()));

    if (hasUrlOptionParams) return;

    const hasAnyOptionSelected = options.some(
      (option) => state[option.name.toLowerCase()]
    );

    if (!hasAnyOptionSelected && variants.length > 0) {
      const targetVariant = (defaultVariant
        ? variants.find((v) => v.title === defaultVariant) || variants[0]
        : variants[0])!;
      startTransition(() => {
        let currentState = { ...state };
        targetVariant.selectedOptions.forEach((opt) => {
          currentState = updateOption(opt.name.toLowerCase(), opt.value);
        });
        if (targetVariant.image) {
          const imageIndex = images.findIndex(
            (img) => img.url === targetVariant.image!.url
          );
          if (imageIndex >= 0) {
            updateImage(imageIndex.toString());
            currentState = { ...currentState, image: imageIndex.toString() };
          }
        }
        updateURL(currentState);
      });
    }
  }, [options, variants, state, updateOption, updateImage, updateURL, images, defaultVariant]);

  if (hasNoOptionsOrJustOneOption) {
    return null;
  }

  const combinations: Combination[] = variants.map((variant) => ({
    id: variant.id,
    availableForSale: variant.availableForSale,
    ...variant.selectedOptions.reduce(
      (accumulator, option) => ({
        ...accumulator,
        [option.name.toLowerCase()]: option.value,
      }),
      {},
    ),
  }));

  return options.map((option) => (
    <form key={option.id}>
      <dl className="mb-2 overflow-visible border-b border-neutral-200 pb-1 md:mb-3 md:pb-2">
        <dt className="mb-1 text-xs font-semibold uppercase leading-none tracking-[0.18em] text-neutral-500 md:mb-2 md:text-sm md:leading-normal">
          {option.name}
        </dt>
        <dd className={clsx(
          "scrollbar-hide -mx-3 flex gap-1.5 px-3 pb-1 pt-px md:mx-0 md:flex-wrap md:gap-2 md:overflow-visible md:px-0 md:pb-0 md:pt-0",
          option.values.length <= 4 ? "flex-nowrap" : "snap-x snap-mandatory overflow-x-auto",
        )}>
          {option.values.map((value) => {
            const optionNameLowerCase = option.name.toLowerCase();
            const optionParams = {
              ...state,
              [optionNameLowerCase]: value.name,
            };

            const filtered = Object.entries(optionParams).filter(
              ([key, value]) =>
                options.find(
                  (option) =>
                    option.name.toLowerCase() === key &&
                    option.values.some((val) => val.name === value),
                ),
            );
            const isAvailableForSale = combinations.find((combination) =>
              filtered.every(
                ([key, value]) =>
                  combination[key] === value && combination.availableForSale,
              ),
            );

            const isActive = state[optionNameLowerCase] === value.name;

            const handleSelect = () => {
              const optionState = updateOption(optionNameLowerCase, value.name);
              let combinedState = optionState;

              const matchedVariant = variants.find((variant) =>
                variant.selectedOptions.every(
                  (opt) => optionState[opt.name.toLowerCase()] === opt.value,
                ),
              );

              if (matchedVariant?.image) {
                const imageIndex = images.findIndex(
                  (img) => img.url === matchedVariant.image!.url,
                );
                if (imageIndex >= 0) {
                  updateImage(imageIndex.toString());
                  combinedState = { ...optionState, image: imageIndex.toString() };
                }
              }

              updateURL(combinedState);
            };

            return (
              <button
                formAction={handleSelect}
                key={value.id}
                aria-disabled={!isAvailableForSale}
                disabled={!isAvailableForSale}
                title={`${option.name} ${value.name}${!isAvailableForSale ? " (Out of Stock)" : ""}`}
                className={clsx(
                  "flex items-center justify-center rounded-full border bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-900 md:min-w-[40px] md:px-2.5 md:py-1.5 md:text-sm",
                  option.values.length <= 4 ? "flex-1" : "min-w-max shrink-0 snap-start",
                  {
                    "border-blue-600 ring-2 ring-blue-600 bg-white": isActive,
                    "border-neutral-200 transition duration-300 ease-in-out hover:border-blue-600 hover:bg-white": !isActive && isAvailableForSale,
                    "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400 line-through": !isAvailableForSale,
                  },
                )}
              >
                {value.name}
              </button>
            );
          })}
        </dd>
      </dl>
    </form>
  ));
}
