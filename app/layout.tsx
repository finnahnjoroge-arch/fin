import { Providers } from "@/components/providers";
import { GeistSans } from "geist/font/sans";
import { getStoreSettings } from "lib/storefront/settings";
import { baseUrl } from "lib/utils";
import { Playfair_Display } from "next/font/google";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";

export const dynamic = "force-dynamic";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata() {
  try {
    const settings = await getStoreSettings();
    const title = settings.metaTitle || settings.storeName || "Watches in Kenya";
    const description = settings.metaDescription || "Shop premium watches in Kenya. Authentic brands, fast delivery, and great prices on luxury and everyday timepieces.";
    return {
      metadataBase: new URL(baseUrl),
      title: {
        default: title,
        template: `%s | ${title}`,
      },
      description,
      keywords: ["watches", "Kenya", "luxury watches", "timepieces", "wristwatches", "Nairobi", "buy watches online"],
      icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
      robots: {
        follow: true,
        index: true,
        googleBot: {
          follow: true,
          index: true,
        },
      },
      alternates: {
        canonical: baseUrl,
      },
      openGraph: {
        type: "website",
        siteName: title,
        title: {
          default: title,
          template: `%s | ${title}`,
        },
        description,
        url: baseUrl,
      },
      twitter: {
        card: "summary_large_image",
        title: {
          default: title,
          template: `%s | ${title}`,
        },
        description,
      },
    };
  } catch {
    return {
      metadataBase: new URL(baseUrl),
      title: {
        default: "Watches in Kenya",
        template: "%s | Watches in Kenya",
      },
      description: "Shop premium watches in Kenya. Authentic brands, fast delivery, and great prices on luxury and everyday timepieces.",
      robots: {
        follow: true,
        index: true,
      },
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="bg-gray-100 text-black selection:bg-teal-300">
        <Providers>
          {children}
          <Toaster closeButton />
        </Providers>
      </body>
    </html>
  );
}
