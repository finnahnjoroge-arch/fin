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
    <div className="container mx-auto p-4 md:p-8">

      <h1 className="mb-4 text-2xl font-bold">Checkout</h1>
      {children}
    </div>
  );
}
