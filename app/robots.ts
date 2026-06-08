import { baseUrl } from "lib/utils";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: ["/api/feed/google.xml"],
      },
      {
        userAgent: "facebookexternalhit",
        allow: ["/api/feed/facebook.xml"],
      },
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/admin", "/api", "/checkout", "/search"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
