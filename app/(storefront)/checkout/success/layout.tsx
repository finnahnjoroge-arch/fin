import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CheckoutSuccessLayout({
  children,
}: React.PropsWithChildren) {
  return <>{children}</>;
}
