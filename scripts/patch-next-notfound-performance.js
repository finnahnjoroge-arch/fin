/**
 * patch-next-notfound-performance.js
 *
 * Fixes a runtime error in dev mode:
 *   "Failed to execute 'measure' on 'Performance': 'NotFound' cannot have a negative
 *    time stamp"
 *
 * ROOT CAUSE
 * ----------
 * This is a bug in the compiled copy of React's Flight client bundle that ships inside
 * Next.js (react-server-dom-turbopack(-experimental)/cjs/...-client.browser.development.js),
 * present in Next.js 15.6.0-canary.60 (React 19). It was fixed upstream in Vercel's
 * Next.js PR #88688 / issue #86060.
 *
 * When `notFound()` is called in a dynamic route, a Server Component render is
 * "rejected"/"aborted". React's dev-only performance tracking then calls
 * `performance.measure(name, { start, end })` where `end` (`childrenEndTime`) is still
 * `-Infinity` because no children were rendered. The `Performance.measure` API rejects
 * a measure whose end timestamp precedes its start timestamp, throwing the error above.
 *
 * The normal (non-error) code path already guards with `0 <= childrenEndTime`, but the
 * "rejected/error" and "aborted" code paths were missing that guard. This script patches
 * the two affected `if (supportsUserTiming) {` blocks to include the same `0 <= ...`
 * check, preventing the negative timestamp.
 *
 * USAGE
 * -----
 *   node scripts/patch-next-notfound-performance.js
 *
 * This is wired into the package.json scripts (`predev`, `prebuild`, `prestart`,
 * `preview`, `deploy`) so it runs automatically before each command. It is idempotent
 * and safe to run repeatedly.
 *
 * NOTE
 * ----
 * This edits files inside `node_modules` (the compiled dependency). Re-running
 * `pnpm install` / `npm install` may restore the original files, which is why this
 * script re-applies the patch on every run.
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

// Possible locations of the compiled React Flight client bundles inside Next.js.
// pnpm lays deps out under node_modules/.pnpm/..., while a plain install or OpenNext's
// vendored copy can live under node_modules/.ignored_next/...
const GLOB_PATTERNS = [
  "node_modules/next/dist/compiled/react-server-dom-turbopack*/cjs/react-server-dom-turbopack*-client.browser.development.js",
];

// Search node_modules recursively for any matching compiled file (handles pnpm store,
// ignored_next, hoisted layouts).
function findTargets() {
  const results = new Set();
  const seenDirs = new Set();
  const skipDirs = new Set([".bin", ".cache", ".git", "typescript"]);

  (function walk(dir, depth) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue;
        if (depth < 12) walk(full, depth + 1);
      } else if (
        entry.name.endsWith("-client.browser.development.js") &&
        entry.name.startsWith("react-server-dom-turbopack")
      ) {
        results.add(full);
      }
    }
  })(path.join(root, "node_modules"), 0);

  return [...results];
}

// The two buggy blocks and their fixed versions. The variable names (`childrenEndTime$...`)
// are minified names from the compiled bundle and differ between the "rejected/error" and
// "aborted" paths, so each is patched with its own in-scope alias.
const PATCHES = [
  {
    // Rejected / errored component (e.g. notFound() thrown)
    old:
      'error = root.reason;\n                    if (supportsUserTiming) {',
    name: "rejected/error (onError / notFound)",
    guard: "supportsUserTiming && 0 <= childrenEndTime$jscomp$1",
  },
  {
    // Aborted component (stream aborted before finishing)
    old: 'childrenEndTime$jscomp$3 = childrenEndTime;\n                  if (supportsUserTiming) {',
    name: "aborted",
    guard: "supportsUserTiming && 0 <= childrenEndTime$jscomp$3",
  },
];

function patchFile(file) {
  let src = fs.readFileSync(file, "utf8");
  let changed = 0;
  for (const p of PATCHES) {
    if (src.includes(p.old)) {
      const guarded = p.old.replace("if (supportsUserTiming)", "if (" + p.guard + ")");
      // Replace every occurrence (there should be exactly one per file per patch).
      src = src.split(p.old).join(guarded);
      changed++;
    }
  }
  if (changed > 0) {
    fs.writeFileSync(file, src, "utf8");
    return changed;
  }
  // Already patched or unknown layout.
  const alreadyGuarded =
    src.includes("supportsUserTiming && 0 <= childrenEndTime$jscomp$1") &&
    src.includes("supportsUserTiming && 0 <= childrenEndTime$jscomp$3");
  return alreadyGuarded ? 0 : null; // null = already has both? handled below
}

function main() {
  const files = findTargets();
  if (files.length === 0) {
    console.warn(
      "[patch-next-notfound-performance] No compiled react-server-dom-turbopack client bundle found. Nothing to patch."
    );
    return 0;
  }

  let patched = 0;
  let already = 0;
  for (const file of files) {
    const result = patchFile(file);
    if (result === null) {
      console.log("[patch-next-notfound-performance] Already patched:", file);
      already++;
    } else if (result > 0) {
      console.log(
        "[patch-next-notfound-performance] Patched %d block(s) in %s",
        result,
        path.relative(root, file)
      );
      patched++;
    } else {
      console.log("[patch-next-notfound-performance] No change needed:", file);
    }
  }

  console.log(
    `[patch-next-notfound-performance] Done. Patched ${patched} file(s), ${already} already had the fix, ${files.length} total found.`
  );
  return 0;
}

process.exit(main());
