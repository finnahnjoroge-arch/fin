"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useOptimistic,
} from "react";

type ProductState = {
  [key: string]: string;
} & {
  image?: string;
};

type ProductContextType = {
  state: ProductState;
  updateOption: (name: string, value: string) => ProductState;
  updateImage: (index: string) => ProductState;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();

  const getInitialState = () => {
    const params: ProductState = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    return params;
  };

  const [state, setOptimisticState] = useOptimistic(
    getInitialState(),
    (prevState: ProductState, update: ProductState) => ({
      ...prevState,
      ...update,
    }),
  );

  // Sync URL params into state on client mount so shared links preserve variant selection
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const params: ProductState = {};
    for (const [key, value] of urlParams.entries()) {
      params[key] = value;
    }
        if (Object.keys(params).length > 0) {
      startTransition(() => setOptimisticState(params));
    }
  }, []);

  const updateOption = (name: string, value: string) => {
    const newState = { [name]: value };
        startTransition(() => setOptimisticState(newState));
    return { ...state, ...newState };
  };

  const updateImage = (index: string) => {
    const newState = { image: index };
    startTransition(() => setOptimisticState(newState));
    return { ...state, ...newState };
  };

  const value = useMemo(
    () => ({
      state,
      updateOption,
      updateImage,
    }),
    [state],
  );

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProduct must be used within a ProductProvider");
  }
  return context;
}

// Updates the url with given state. Defaults to 'replace' so that changing product
// options does not keep adding to the history stack, forcing the user to press back
// sevral times to get back to the PLP or other entry page.
export function useUpdateURL() {
  const router = useRouter();

  return (state: ProductState, useReplace = true) => {
    const newParams = new URLSearchParams(window.location.search);
    Object.entries(state).forEach(([key, value]) => {
      newParams.set(key, value);
    });

    const url = `?${newParams.toString()}`;
    const options = { scroll: false };

    if (useReplace) {
      router.replace(url, options);
    } else {
      router.push(url, options);
    }
  };
}
