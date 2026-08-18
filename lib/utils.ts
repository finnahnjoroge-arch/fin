import { clsx, type ClassValue } from "clsx";
import { ReadonlyURLSearchParams } from "next/navigation";
import { twMerge } from "tailwind-merge";

export const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://finnorah.co.ke";

export const createUrl = (
  pathname: string,
  params: URLSearchParams | ReadonlyURLSearchParams,
) => {
  const paramsString = params.toString();
  const queryString = `${paramsString.length ? "?" : ""}${paramsString}`;

  return `${pathname}${queryString}`;
};

export const ensureStartsWith = (stringToCheck: string, startsWith: string) =>
  stringToCheck.startsWith(startsWith)
    ? stringToCheck
    : `${startsWith}${stringToCheck}`;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CLOUDINARY_MARKER = "/image/upload/";

/**
 * Injects Cloudinary delivery/optimization transformations into a Cloudinary
 * image URL so Cloudinary can auto-select the best format, compress, and
 * resize. For example `.../image/upload/v1/img.jpg` becomes
 * `.../image/upload/f_auto,q_auto,w_800/v1/img.jpg`.
 *
 * Non-Cloudinary URLs are returned unchanged. If the URL already contains a
 * transformation segment, it is replaced rather than duplicated.
 */
export function getCloudinaryUrl(
  url: string | undefined,
  options: { width?: number } = {},
): string {
  if (!url) return "";
  const idx = url.indexOf(CLOUDINARY_MARKER);
  if (idx === -1) return url;

  const base = url.slice(0, idx + CLOUDINARY_MARKER.length);
  const parts = url.slice(idx + CLOUDINARY_MARKER.length).split("/");

    // A Cloudinary URL after /upload/ is: [transforms]/[version]/[public_id].
  // Detect whether the first segment is an existing transformation set. A
  // transformation segment contains characters like "_" followed by values
  // (e.g. "w_500"), whereas a version begins with "v" followed by digits and
  // a lone segment with no "_" is a public_id when no version is present.
  const first = parts[0] || "";
  const isVersion = /^v\d+/.test(first);
  const isTransform =
    !isVersion && (first.includes("_") || first.includes(","));

  // Drop an existing transformation segment so it's replaced by ours.
  if (isTransform && !isVersion) {
    parts.shift();
  }

  const transforms = ["f_auto", "q_auto"];
  if (options.width) {
    transforms.push(`w_${options.width}`);
  }

  return `${base}${transforms.join(",")}/${parts.join("/")}`;
}

