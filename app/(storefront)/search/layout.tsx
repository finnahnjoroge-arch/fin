import { Suspense } from "react";
import ChildrenWrapper from "./children-wrapper";

export default function SearchLayout({
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

