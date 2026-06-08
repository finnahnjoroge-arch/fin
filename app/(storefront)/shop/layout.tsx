import { Suspense } from "react";
import ChildrenWrapper from "../search/children-wrapper";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-4 text-black dark:text-white">
      <Suspense fallback={null}>
        <ChildrenWrapper>{children}</ChildrenWrapper>
      </Suspense>
    </div>
  );
}
