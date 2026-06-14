import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CheckoutLayout({
  children,
}: React.PropsWithChildren) {
  return (
    <div className="mx-auto max-w-(--breakpoint-2xl) px-0 md:px-8 md:py-8">
      <div className="hidden md:block">
        <h1 className="mb-4 text-2xl font-bold">Checkout</h1>
      </div>
      {children}
    </div>
  );
}
