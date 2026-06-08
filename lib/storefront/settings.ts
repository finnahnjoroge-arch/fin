import { connectDB } from "@/lib/mongodb";

export type ScriptLocation = "head" | "body_start" | "body_end";
export type ScriptType = "js" | "css" | "html";

export type ScriptSnippet = {
  id: string;
  name: string;
  code: string;
  location: ScriptLocation;
  type: ScriptType;
  enabled: boolean;
};

function disableFacebookAutoConfig(code: string): string {
  if (!code.includes("connect.facebook.net") || !code.includes("fbq('init'"))
    return code;
  if (code.includes("autoConfig")) return code;

  return code.replace(
    /fbq\('init',\s*'([^']+)'\);/,
    "fbq('set', 'autoConfig', false, '$1');\nfbq('init', '$1');",
  );
}

function getFacebookPixelId(code: string): string | null {
  if (!code.includes("connect.facebook.net") && !code.includes("fbq('init'"))
    return null;

  return code.match(/fbq\('init',\s*'([^']+)'\)/)?.[1] ?? null;
}

function normalizeScripts(scripts: ScriptSnippet[]): ScriptSnippet[] {
  return scripts
    .map((script) => ({
      ...script,
      code: disableFacebookAutoConfig(script.code),
    }))
    .filter((script) => !getFacebookPixelId(script.code));
}

function getFacebookPixelIdFromScripts(scripts: ScriptSnippet[]): string {
  for (const script of scripts) {
    const pixelId = getFacebookPixelId(script.code);
    if (pixelId) return pixelId;
  }

  return "";
}

const defaultSettings = {
  storeId: "default",
  storeName: "ACME Store",
  storeEmail: "",
  storePhone: "",
  whatsappPhone: "",
  storeAddress: "",
  currency: "KES",
  country: "Kenya",
  metaTitle: "ACME Store",
  metaDescription: "",
  shopMetaTitle: "",
  shopMetaDescription: "",
  shippingCost: 200,
  freeShippingThreshold: 5000,
  shippingNote: "",
  deliveryRegions: [] as string[],
  logoUrl: "",
  logoIconUrl: "",
  faviconUrl: "",
  showLogoIcon: true,
  primaryColor: "#2563eb",
  announcementBar: false,
  announcementText: "",
  announcementLink: "",
  heroEnabled: false,
  heroMode: "text",
  heroTitle: "",
  heroSubtitle: "",
  heroImageUrl: "",
  heroImageUrls: [] as string[],
  heroAutoplayInterval: 3000,
  heroButtonText: "Shop Now",
  heroButtonLink: "",
  heroBgColor: "#f5f5dc",
  facebookPixelId: "",
  scripts: [] as ScriptSnippet[],
  navbarDark: false,
};

function migrateOldScripts(settings: any): ScriptSnippet[] {
  if (Array.isArray(settings.scripts)) return settings.scripts;

  const scripts: ScriptSnippet[] = [];
  const ts = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2);

  if (settings.googleAnalyticsId) {
    scripts.push({
      id: ts(),
      name: "Google Analytics",
      code: `window.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', '${settings.googleAnalyticsId}');`,
      location: "head",
      type: "js",
      enabled: true,
    });
    scripts.push({
      id: ts(),
      name: "Google Analytics Loader",
      code: `<script src="https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}"></script>`,
      location: "head",
      type: "html",
      enabled: true,
    });
  }

  if (settings.googleTagManagerId) {
    scripts.push({
      id: ts(),
      name: "Google Tag Manager",
      code: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\nnew Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\nj=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n})(window,document,'script','dataLayer','${settings.googleTagManagerId}');`,
      location: "head",
      type: "js",
      enabled: true,
    });
    scripts.push({
      id: ts(),
      name: "Google Tag Manager NoScript",
      code: `<iframe src="https://www.googletagmanager.com/ns.html?id=${settings.googleTagManagerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
      location: "body_start",
      type: "html",
      enabled: true,
    });
  }

  if (settings.facebookPixelId) {
    scripts.push({
      id: ts(),
      name: "Facebook Pixel",
      code: `!function(f,b,e,v,n,t,s)\n{if(f.fbq)return;n=f.fbq=function(){n.callMethod?\nn.callMethod.apply(n,arguments):n.queue.push(arguments)};\nif(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\nn.queue=[];t=b.createElement(e);t.async=!0;\nt.src=v;s=b.getElementsByTagName(e)[0];\ns.parentNode.insertBefore(t,s)}(window, document,'script',\n'https://connect.facebook.net/en_US/fbevents.js');\nfbq('set', 'autoConfig', false, '${settings.facebookPixelId}');\nfbq('init', '${settings.facebookPixelId}');\nfbq('track', 'PageView');`,
      location: "head",
      type: "js",
      enabled: true,
    });
  }

  if (settings.tiktokPixelId) {
    scripts.push({
      id: ts(),
      name: "TikTok Pixel",
      code: `!function (w, d, t) {\n  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];\n  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];\n  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};\n  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);\n  ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";\n  ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)\n  ttq.setAndDefer(e,ttq.methods[n]);return e};\n  var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i;\n  var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};\n  ttq.load('${settings.tiktokPixelId}');\n  ttq.page();\n}(window, document, 'ttq');`,
      location: "head",
      type: "js",
      enabled: true,
    });
  }

  function isValidCode(code: unknown): code is string {
    return (
      typeof code === "string" &&
      code.trim().length > 0 &&
      !code.includes("custom-head-scripts") &&
      !code.includes("custom-body-start-scripts") &&
      !code.includes("custom-body-end-scripts") &&
      !code.includes('"id":"')
    );
  }

  if (isValidCode(settings.headScripts)) {
    scripts.push({
      id: ts(),
      name: "Custom Head Script",
      code: settings.headScripts,
      location: "head",
      type: "html",
      enabled: true,
    });
  }
  if (isValidCode(settings.bodyStartScripts)) {
    scripts.push({
      id: ts(),
      name: "Custom Body Start Script",
      code: settings.bodyStartScripts,
      location: "body_start",
      type: "html",
      enabled: true,
    });
  }
  if (isValidCode(settings.bodyEndScripts)) {
    scripts.push({
      id: ts(),
      name: "Custom Body End Script",
      code: settings.bodyEndScripts,
      location: "body_end",
      type: "html",
      enabled: true,
    });
  }

  return normalizeScripts(scripts);
}

export async function getStoreSettings(): Promise<typeof defaultSettings> {
  const db = await connectDB();
  const raw = await db.collection("settings").findOne({ storeId: "default" });
  if (!raw) return defaultSettings;

  // Strip non-serializable MongoDB fields before returning
  const { _id, createdAt, updatedAt, __v, ...cleanRaw } = raw;

  const settings = {
    ...defaultSettings,
    ...cleanRaw,
    heroImageUrls: Array.isArray(cleanRaw.heroImageUrls)
      ? cleanRaw.heroImageUrls
      : cleanRaw.heroImageUrl
        ? [cleanRaw.heroImageUrl]
        : [],
    heroAutoplayInterval: cleanRaw.heroAutoplayInterval === 5000 ? 5000 : 3000,
    logoIconUrl: cleanRaw.logoIconUrl ?? "",
    showLogoIcon: cleanRaw.showLogoIcon ?? true,
    deliveryRegions: cleanRaw.deliveryRegions || [],
  };

  if (!Array.isArray(raw.scripts)) {
    const migratedScripts = migrateOldScripts(raw);
    settings.facebookPixelId =
      settings.facebookPixelId ||
      getFacebookPixelIdFromScripts(migratedScripts);
    settings.scripts = migratedScripts;
  } else {
    settings.facebookPixelId =
      settings.facebookPixelId || getFacebookPixelIdFromScripts(raw.scripts);
    settings.scripts = normalizeScripts(
      raw.scripts.filter(
        (s: any) =>
          s &&
          typeof s.code === "string" &&
          s.code.trim().length > 0 &&
          !s.code.includes("custom-head-scripts") &&
          !s.code.includes("custom-body-start-scripts") &&
          !s.code.includes("custom-body-end-scripts") &&
          !s.code.includes('"id":"'),
      ),
    );
  }

  return settings;
}
