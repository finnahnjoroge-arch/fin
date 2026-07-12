import { Suspense } from "react";
import ChildrenWrapper from "../../search/children-wrapper";

export default function ProductCategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    return (
    <Suspense fallback={null}>
      <ChildrenWrapper>{children}</ChildrenWrapper>
    </Suspense>
  );
}

