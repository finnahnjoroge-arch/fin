import clsx from "clsx";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

const contentToHtml = (value: string) => {
  if (/<[a-z][\s\S]*>/i.test(value)) return value;
  return value
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("### ")) return `<h3>${escapeHtml(trimmed.slice(4))}</h3>`;
      if (trimmed.startsWith("## ")) return `<h2>${escapeHtml(trimmed.slice(3))}</h2>`;
      if (trimmed.startsWith("# ")) return `<h1>${escapeHtml(trimmed.slice(2))}</h1>`;
      if (trimmed.split("\n").every((line) => line.trim().startsWith("- "))) {
        return `<ul>${trimmed.split("\n").map((line) => `<li>${escapeHtml(line.trim().slice(2))}</li>`).join("")}</ul>`;
      }
      return `<p>${escapeHtml(trimmed).replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
};

const Prose = ({ html, className }: { html: string; className?: string }) => {
  return (
    <div
      className={clsx(
        "prose mx-auto max-w-6xl text-base leading-6 text-neutral-700 prose-headings:mt-3 prose-headings:mb-1 prose-headings:font-semibold prose-headings:tracking-wide prose-headings:text-neutral-900 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-h5:text-base prose-h6:text-sm prose-p:my-1.5 prose-a:text-neutral-900 prose-a:underline prose-a:hover:text-blue-700 prose-strong:text-neutral-900 prose-ol:mt-3 prose-ol:mb-1 prose-ol:list-decimal prose-ol:pl-5 prose-ul:mt-3 prose-ul:mb-1 prose-ul:list-disc prose-ul:pl-5 prose-li:my-0.5 prose-hr:my-3",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: contentToHtml(html) }}
    />
  );
};

export default Prose;
