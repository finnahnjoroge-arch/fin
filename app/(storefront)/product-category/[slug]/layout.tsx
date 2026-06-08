import { Suspense } from "react";
import ChildrenWrapper from "../../search/children-wrapper";

export default function ProductCategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

    <div className="mx-auto max-w-(--breakpoint-2xl) px-4 pb-8 pt-4 sm:pb-12 sm:pt-6">
      <Suspense fallback={null}>
        <ChildrenWrapper>{children}</ChildrenWrapper>
      </Suspense>
    </div>
  );
}
