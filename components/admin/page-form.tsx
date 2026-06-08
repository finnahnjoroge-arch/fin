"use client";

import RichTextEditor from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PageFormProps {
  initialData?: {
    _id?: string;
    title: string;
    slug: string;
    content: string;
    status: string;
    sortOrder?: number;
    metaTitle: string;
    metaDescription: string;
  };
}

const generateSlug = (str: string) =>
  str.toLowerCase().trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

type PageType = "return" | "privacy" | "terms" | "shipping" | "cookie" | "about" | "contact" | "generic";

type StoreSettings = {
  storeName: string;
  storePhone: string;
  whatsappPhone: string;
  storeEmail: string;
  address: string;
  currency: string;
  shippingCost: number;
  freeShippingThreshold: number;
  deliveryRegions: string[];
};

function detectPageType(title: string): PageType {
  const t = title.toLowerCase();
  if (t.includes("return") || t.includes("refund")) return "return";
  if (t.includes("privacy")) return "privacy";
  if (t.includes("terms") || t.includes("conditions")) return "terms";
  if (t.includes("shipping") || t.includes("delivery")) return "shipping";
  if (t.includes("cookie")) return "cookie";
  if (t.includes("about")) return "about";
  if (t.includes("contact")) return "contact";
  return "generic";
}

const defaultStoreSettings: StoreSettings = {
  storeName: "our store",
  storePhone: "",
  whatsappPhone: "",
  storeEmail: "",
  address: "",
  currency: "KES",
  shippingCost: 0,
  freeShippingThreshold: 0,
  deliveryRegions: [],
};

const formatMoney = (amount: number, currency: string) =>
  `${currency} ${new Intl.NumberFormat("en-KE", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)}`;

const contactLines = (settings: StoreSettings) =>
  [
    settings.storeEmail ? `Email: ${settings.storeEmail}` : "",
    settings.storePhone ? `Phone: ${settings.storePhone}` : "",
    settings.whatsappPhone ? `WhatsApp: ${settings.whatsappPhone}` : "",
    settings.address ? `Address: ${settings.address}` : "",
  ].filter(Boolean).join("\n");

function generatePageContent(title: string, pageType: PageType, settings: StoreSettings) {
  const storeName = settings.storeName || "our store";
  const contacts = contactLines(settings) || "Contact us through the contact details provided on our website.";
  const regions = settings.deliveryRegions.length ? settings.deliveryRegions.join(", ") : "Kenya";
  const shippingCost = settings.shippingCost > 0 ? formatMoney(settings.shippingCost, settings.currency) : "the shipping fee shown during checkout";
  const freeShipping = settings.freeShippingThreshold > 0 ? formatMoney(settings.freeShippingThreshold, settings.currency) : "eligible orders";
  const updated = new Date().toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });

  switch (pageType) {
    case "privacy":
      return `# Privacy Policy

Last updated: ${updated}

At ${storeName}, we respect your privacy and are committed to protecting the personal information you share with us.

## Information We Collect

When you place an order, contact us, create an enquiry, or use our website, we may collect your name, phone number, email address, delivery address, order details, and payment or delivery preferences.

## How We Use Your Information

We use your information to process orders, arrange delivery, provide customer support, send order updates, respond to enquiries, prevent fraud, and improve our products and services.

## Sharing Your Information

We do not sell your personal information. We may share necessary details with delivery partners, payment providers, support tools, or service providers only when required to complete your order or operate our store.

## Cookies and Analytics

Our website may use cookies and basic analytics tools to improve performance, understand store activity, and provide a better shopping experience.

## Data Security

We take reasonable steps to protect your information from unauthorised access, loss, misuse, or disclosure.

## Your Rights

You may contact us to request access, correction, or deletion of your personal information, subject to legal and operational requirements.

## Contact Us

${contacts}`;
    case "terms":
      return `# Terms and Conditions

Last updated: ${updated}

Welcome to ${storeName}. By using our website or placing an order, you agree to these Terms and Conditions.

## Products and Pricing

We aim to display accurate product information, pricing, availability, and images. Prices may change without notice, and availability is subject to stock.

## Orders

After placing an order, we may contact you to confirm details before dispatch. We reserve the right to cancel orders that cannot be fulfilled, contain incorrect information, or appear fraudulent.

## Payments

Payment terms are shown during checkout. Orders may only be processed once the required payment or confirmation has been completed.

## Delivery

Delivery timelines and charges depend on your location and selected delivery method. Please review our Shipping Policy for more details.

## Returns and Refunds

Returns, exchanges, and refunds are handled according to our Return and Refund Policy.

## Website Use

You agree not to misuse the website, interfere with its operation, or use it for unlawful purposes.

## Limitation of Liability

To the fullest extent allowed by law, ${storeName} is not liable for indirect losses, delays caused by third parties, or issues outside our reasonable control.

## Contact Us

${contacts}`;
    case "return":
      return `# Return and Refund Policy

Last updated: ${updated}

At ${storeName}, we want you to be satisfied with your purchase. Please read this policy before requesting a return, exchange, or refund.

## Return Eligibility

Items may be eligible for return if they are unused, undamaged, in their original packaging, and accompanied by proof of purchase.

## Non-Returnable Items

Items that have been used, damaged after delivery, altered, or returned without original packaging may not qualify for return.

## Return Process

To request a return, contact us with your order details, reason for return, and clear photos where applicable. We will review your request and guide you on the next steps.

## Refunds

Approved refunds are processed after the returned item has been received and inspected. Refund timelines may vary depending on the payment method or provider.

## Exchanges

Where available, exchanges may be offered for eligible items subject to stock availability.

## Return Shipping

Return delivery costs may be the customer's responsibility unless the return is due to an error on our side or a defective item.

## Contact Us

${contacts}`;
    case "shipping":
      return `# Shipping Policy

Last updated: ${updated}

${storeName} delivers orders to ${regions}.

## Delivery Areas

We deliver within our supported regions. If your location is outside our regular delivery areas, contact us before placing an order.

## Shipping Fees

Standard shipping is ${shippingCost}. Orders above ${freeShipping} may qualify for free shipping where available.

## Delivery Timelines

Delivery timelines may vary depending on your location, order confirmation time, product availability, courier schedules, and public holidays.

## Order Confirmation

We may contact you by phone, WhatsApp, or email to confirm your order and delivery details before dispatch.

## Failed Deliveries

If delivery fails because of incorrect details, unavailable recipient, or lack of response, additional delivery charges may apply.

## Contact Us

${contacts}`;
    case "cookie":
      return `# Cookie Policy

Last updated: ${updated}

This Cookie Policy explains how ${storeName} may use cookies and similar technologies on our website.

## What Are Cookies?

Cookies are small files stored on your device that help websites remember preferences, improve performance, and understand how visitors use the site.

## How We Use Cookies

We may use cookies to keep the website working properly, improve your shopping experience, remember preferences, analyse traffic, and support marketing or performance tools.

## Managing Cookies

You can control or disable cookies through your browser settings. Some website features may not work properly if cookies are disabled.

## Contact Us

${contacts}`;
    case "about":
      return `# About ${storeName}

${storeName} is an online store committed to providing quality products, reliable service, and a convenient shopping experience.

## What We Offer

We focus on offering carefully selected products, clear pricing, responsive support, and dependable delivery across our supported locations.

## Our Commitment

We aim to make shopping simple, secure, and transparent from product selection to delivery.

## Customer Support

If you have questions about our products, orders, delivery, or policies, our team is ready to help.

## Contact Us

${contacts}`;
    case "contact":
      return `# Contact Us

We are here to help with product questions, order support, delivery enquiries, and general assistance.

## Contact Details

${contacts}

## Support Hours

Contact us during normal business hours and we will respond as soon as possible.

## Order Enquiries

For order-related support, please include your name, phone number, order details, and the product you purchased or enquired about.`;
    default:
      return `# ${title}

Welcome to ${storeName}.

Use this page to share important information with your customers. You can edit this generated content before publishing.

## Contact Us

${contacts}`;
  }
}

export default function PageForm({ initialData }: PageFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?._id;

  const [form, setForm] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    content: initialData?.content || "",
    status: initialData?.status || "draft",
    sortOrder: initialData?.sortOrder ?? 0,
    metaTitle: initialData?.metaTitle || "",
    metaDescription: initialData?.metaDescription || "",
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setStoreSettings({
          ...defaultStoreSettings,
          storeName: data.storeName || defaultStoreSettings.storeName,
          storePhone: data.storePhone || "",
          whatsappPhone: data.whatsappPhone || "",
          storeEmail: data.storeEmail || "",
          address: data.address || "",
          currency: data.currency || "KES",
          shippingCost: Number(data.shippingCost) || 0,
          freeShippingThreshold: Number(data.freeShippingThreshold) || 0,
          deliveryRegions: Array.isArray(data.deliveryRegions) ? data.deliveryRegions : [],
        });
      })
      .catch(() => {});
  }, []);

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugManuallyEdited ? prev.slug : generateSlug(title),
    }));
  };

  const handleGenerateContent = () => {
    if (!form.title.trim()) {
      toast.error("Enter a title first");
      return;
    }
    const pageType = detectPageType(form.title);
    const content = generatePageContent(form.title, pageType, storeSettings);
    const metaTitle = form.metaTitle || `${form.title} | ${storeSettings.storeName}`;
    const metaDescription = form.metaDescription || `${form.title} for ${storeSettings.storeName}.`;
    setForm((prev) => ({ ...prev, content, metaTitle, metaDescription }));
    toast.success("Content generated from store info");
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    setSaving(true);
    const url = isEditing
      ? `/api/admin/pages/${initialData!._id}`
      : "/api/admin/pages";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success(isEditing ? "Page updated" : "Page created");
      router.push("/admin/pages");
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to save page");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Page title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <div className="flex gap-2">
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setForm((p) => ({ ...p, slug: e.target.value }));
                }}
                placeholder="page-slug"
              />
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setSlugManuallyEdited(false);
                  setForm((prev) => ({ ...prev, slug: generateSlug(prev.title) }));
                }}
              >
                Auto
              </Button>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Content</Label>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleGenerateContent}
              >
                <Sparkles className="mr-1 h-4 w-4" />
                Generate Content
              </Button>
            </div>
            <RichTextEditor
              id="content"
              value={form.content}
              onChange={(content) => setForm((p) => ({ ...p, content }))}
              placeholder="Page content..."
              rows={12}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">Footer Order</Label>
            <Input
              id="sortOrder"
              type="number"
              min={0}
              step={1}
              value={form.sortOrder}
              onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) || 0 }))}
              placeholder="0"
            />
            <p className="text-xs text-neutral-500">Lower numbers appear first in the footer.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              value={form.metaTitle}
              onChange={(e) => setForm((p) => ({ ...p, metaTitle: e.target.value }))}
              placeholder="SEO title"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={form.metaDescription}
              onChange={(e) => setForm((p) => ({ ...p, metaDescription: e.target.value }))}
              placeholder="SEO description"
              rows={3}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Page" : "Create Page"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/admin/pages")}>
            Cancel
          </Button>
        </div>
      </div>

    </div>
  );
}
