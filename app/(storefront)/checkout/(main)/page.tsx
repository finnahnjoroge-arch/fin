"use client";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { useCart } from "components/cart/cart-context";
import Price from "components/price";
import { PageSpinner } from "components/spinner";
import { ChevronDown, Pencil } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNotes, setShowNotes] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  // Selected payment method: "mpesa" triggers the M-Pesa STK push flow;
  // "cash_on_delivery" is the default and requires no online payment.
  const [paymentMethod, setPaymentMethod] = useState<"cash_on_delivery" | "mpesa">(
    "cash_on_delivery"
  );
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    region: "",


        country: "Kenya",
    notes: "",
    website: "", // honeypot anti-spam field (hidden from humans)
  });

  const [settings, setSettings] = useState({
    shippingCost: 200,
    freeShippingThreshold: 5000,
    shippingNote: "",
    currency: "KES",
    paymentMethods: [
      {
        id: "cash_on_delivery",
        name: "Cash on Delivery",
        description: "Pay on delivery.",
        enabled: true,
      },
      {
        id: "mpesa",
        name: "M-Pesa (Receive Prompt)",
        description: "You'll receive an M-Pesa prompt on your phone after placing your order.",
        enabled: true,
      },
    ] as { id: "cash_on_delivery" | "mpesa"; name: string; description: string; enabled: boolean }[],
  });

  useEffect(() => {
    fetch("/api/storefront/settings")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          const paymentMethods = Array.isArray(data.paymentMethods)
            ? data.paymentMethods
            : [
                {
                  id: "cash_on_delivery",
                  name: "Cash on Delivery",
                  description: "Pay on delivery.",
                  enabled: true,
                },
                {
                  id: "mpesa",
                  name: "M-Pesa (Receive Prompt)",
                  description: "You'll receive an M-Pesa prompt on your phone after placing your order.",
                  enabled: true,
                },
              ];
          setSettings({
            shippingCost: data.shippingCost ?? 200,
            freeShippingThreshold: data.freeShippingThreshold ?? 5000,
            shippingNote: data.shippingNote || "",
            currency: data.currency || "KES",
            paymentMethods,
          });
          const enabled = paymentMethods.filter((m: any) => m.enabled);
          if (enabled.length > 0) {
            setPaymentMethod(enabled[0].id);
          }
        }
      })
      .catch(() => { /* ignore */ });
  }, []);

  if (cart === undefined) {
    return <PageSpinner text="Loading checkout…" />;
  }

  if (cart.lines.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-neutral-500">Your cart is empty.</p>
      </div>
    );
  }

  const subtotal = Number(cart.cost.subtotalAmount.amount);
  const shippingCost = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingCost;
  const total = subtotal + shippingCost;






    const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.phone.trim()) errs.phone = "Phone number is required";


        if (!form.email.trim()) {
      // email is optional
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Please enter a valid email address";
    }
    return errs;
  };

  // Scroll back up to the phone field and focus it so the customer can edit
  // the number that will receive the M-Pesa prompt.
  const editPhone = () => {
    const el = document.getElementById("phoneInput");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLInputElement).focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const items = cart.lines.map((line) => {
      const unitPrice = Number(line.cost.totalAmount.amount) / line.quantity;
      const isSimpleProduct = line.merchandise.id === line.merchandise.product.id;
      return {
        productId: line.merchandise.product.id,
        variantId: isSimpleProduct ? undefined : line.merchandise.id,
        quantity: line.quantity,
        price: unitPrice,
        name: line.merchandise.title && line.merchandise.title !== "Default Title" && !isSimpleProduct ? `${line.merchandise.product.title} — ${line.merchandise.title}` : line.merchandise.product.title,
        sku: line.merchandise.sku || line.merchandise.product.sku || "",
        image:
          line.merchandise.product.image?.url ||
          line.merchandise.product.featuredImage?.url ||
          "",
      };
    });

    try {
      const res = await fetch("/api/storefront/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },

























                body: JSON.stringify({
          items,
          shippingAddress: {
            fullName: form.fullName,
            phone: form.phone,
            email: form.email,
            address: form.address,
            city: form.city,
            region: form.region,
            country: form.country,
            notes: form.notes,
          },
          // Send the chosen payment method so the order-creation route knows
          // whether to trigger the M-Pesa STK push.
          paymentMethod,
          subtotal,
          shippingCost,
          total,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to place order");

      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("cart-updated"));
      // Pass both the order id and (for M-Pesa) the CheckoutRequestID so the
      // success page can begin live-polling the payment result.
      const cid = data.checkoutRequestId
        ? `&checkoutRequestId=${encodeURIComponent(data.checkoutRequestId)}`
        : "";
      router.push(`/checkout/success?orderId=${data.orderId}${cid}`);
    } catch (err: any) {
      setErrors({ form: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Stacked thumbnails for order summary
  const thumbnailStack = (
    <div className="flex -space-x-2 flex-none">
      {cart.lines.slice(0, 3).map((line, i) => (
        <div
          key={i}
          className="relative h-10 w-10 overflow-hidden rounded border-2 border-white bg-white shadow-sm"
          style={{ zIndex: cart.lines.length - i }}
        >
          <Image
            src={
              line.merchandise.product.image?.url ||
              line.merchandise.product.featuredImage?.url ||
              ""
            }
            alt={line.merchandise.product.title}
            fill
            className="object-cover"
          />
        </div>
      ))}
      {cart.lines.length > 3 && (
        <div className="flex h-10 w-10 items-center justify-center rounded border-2 border-white bg-neutral-100 text-xs font-medium text-neutral-600 shadow-sm">
          +{cart.lines.length - 3}
        </div>
      )}
    </div>
  );

  // Total item count text
  const totalItems = cart.lines.reduce((sum, line) => sum + line.quantity, 0);

  // Compact Shopify-style order summary bar (no container - just content)
  const compactOrderSummary = (
    <div className="flex items-center gap-3">
      {thumbnailStack}
      
      {/* Item count and chevron */}
      <div className="flex flex-1 items-center gap-1 text-sm text-neutral-600">
        <span>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {/* Subtotal amount */}
      <Price
        className="flex-none text-base font-semibold text-neutral-900"
        amount={subtotal.toString()}
        currencyCode={cart.cost.subtotalAmount.currencyCode}
      />
    </div>
  );

  // Order totals breakdown - simplified (no subtotal line)
  const orderTotals = (
    <div className="space-y-1.5 text-sm">
      {settings.shippingNote && (
        <p className="text-xs text-neutral-500">{settings.shippingNote}</p>
      )}
      <div className="flex justify-between">
        <span className="text-neutral-600">Delivery</span>
        {shippingCost === 0 ? (
          <span className="text-sm font-medium text-green-600">Free</span>
        ) : (
          <Price amount={shippingCost.toString()} currencyCode={cart.cost.subtotalAmount.currencyCode} />
        )}
      </div>
      <div className="flex justify-between border-t border-neutral-100 pt-2 text-base font-bold text-neutral-900">
        <span>Total</span>
        <Price amount={total.toString()} currencyCode={cart.cost.subtotalAmount.currencyCode} />
      </div>
    </div>
  );

  // Expanded order summary with thumbnails and subtotal
  const expandedOrderSummary = (
    <div className="flex items-center gap-3 py-2">
      {thumbnailStack}
      <div className="flex-1 text-sm text-neutral-600">
        {totalItems} {totalItems === 1 ? 'item' : 'items'}
      </div>
      <Price
        className="flex-none text-base font-semibold text-neutral-900"
        amount={subtotal.toString()}
        currencyCode={cart.cost.subtotalAmount.currencyCode}
      />
    </div>
  );



        return (
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
        {errors.form && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
            {errors.form}
          </div>
        )}

        <div className="grid gap-6 md:gap-8 md:grid-cols-2 items-start">
          {/* LEFT COLUMN: Delivery info only */}
          <div className="min-w-0">
            <div className="rounded-lg border border-neutral-200 bg-white shadow-md overflow-hidden">
              <div className="bg-neutral-50/80 px-4 py-3 border-b border-neutral-200">
                <h2 className="text-base font-semibold text-neutral-900">Delivery info</h2>
              </div>
              <div className="p-4 space-y-3">
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Full name"
                  className="h-11"
                />
                {errors.fullName && <p className="-mt-2 text-xs text-red-500">{errors.fullName}</p>}

                <div className="grid gap-3 grid-cols-2">
                  <Input
                    id="phoneInput"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Phone number"
                    className="h-11"
                  />
                  <Input
                    value={form.city}
                    onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                    placeholder="City"
                    className="h-11"
                  />
                </div>
                {errors.phone && <p className="-mt-2 text-xs text-red-500">{errors.phone}</p>}

                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Email (optional)"
                  className="h-11"
                />

                <textarea
                  className="w-full rounded-md border border-neutral-200 bg-white px-3 py-3 text-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Address"
                />
                {errors.address && <p className="-mt-2 text-xs text-red-500">{errors.address}</p>}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="addNote"
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black"
                    checked={showNotes}
                    onChange={(e) => setShowNotes(e.target.checked)}
                  />
                  <label htmlFor="addNote" className="text-sm text-neutral-600 cursor-pointer">
                    Add delivery notes (optional)
                  </label>
                </div>

                {showNotes && (
                  <textarea
                    className="w-full rounded-md border border-neutral-200 bg-white px-3 py-3 text-sm placeholder:text-neutral-400"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Leave at the gate, ring doorbell, etc."
                  />
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary, Payment, Button */}
          <div className="min-w-0">
            {/* Mobile: Show delivery info continues here */}
            <div className="md:hidden">
              <div className="rounded-lg border border-neutral-200 bg-white shadow-md overflow-hidden mt-6">
                <div className="bg-neutral-50/80 px-4 py-3 border-b border-neutral-200">
                  <h2 className="text-base font-semibold text-neutral-900">Payment</h2>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    {settings.paymentMethods
                      .filter((m) => m.enabled)
                      .map((method) => {
                        const isSelected = paymentMethod === method.id;
                        return (
                          <label
                            key={method.id}
                            className={`block rounded-md border px-3 py-2.5 cursor-pointer ${
                              isSelected
                                ? method.id === "mpesa"
                                  ? "border-emerald-600 bg-emerald-50"
                                  : "border-neutral-900 bg-neutral-100"
                                : "border-neutral-200 bg-white"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value={method.id}
                                checked={isSelected}
                                onChange={() => setPaymentMethod(method.id)}
                                className={`h-4 w-4 ${
                                  method.id === "mpesa"
                                    ? "text-emerald-600"
                                    : "text-neutral-900"
                                }`}
                              />
                              <span className="text-sm font-medium">
                                {method.name}
                              </span>
                            </span>
                            {isSelected && method.id === "mpesa" && (
                              <span className="mt-1.5 flex items-center pl-6 text-xs text-neutral-500">
                                Send prompt to&nbsp;
                                <span className="font-medium text-neutral-700">
                                  {form.phone || "your number"}
                                </span>
                                <button
                                  type="button"
                                  onClick={editPhone}
                                  className="ml-1 inline-flex items-center align-middle text-neutral-400 hover:text-neutral-900"
                                  title="Edit phone number"
                                  aria-label="Edit phone number"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            )}
                            {isSelected && method.description && method.id !== "mpesa" && (
                              <span className="mt-1.5 block pl-6 text-xs text-neutral-500">
                                {method.description}
                              </span>
                            )}
                          </label>
                        );
                      })}
                  </div>

                  <Button className="w-full h-11 text-base" type="submit" disabled={submitting}>
                    {submitting 
                      ? "Placing Order..." 
                      : paymentMethod === "mpesa"
                        ? `Pay ${settings.currency} ${total.toLocaleString()}`
                        : `Complete order ${settings.currency} ${total.toLocaleString()}`
                    }
                  </Button>
                </div>
              </div>

              {/* Mobile Order Summary */}
              <div className="rounded-lg border border-neutral-200 bg-white shadow-md overflow-hidden p-4 mt-6 bg-neutral-50/50">
                <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
                  <CollapsibleTrigger className="w-full" asChild>
                    <button type="button" className="w-full">
                      {compactOrderSummary}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pt-3 mt-3 border-t border-neutral-200">
                      {orderTotals}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>

            {/* Desktop: Order Summary, Payment, Button */}
            <div className="hidden md:block rounded-lg border border-neutral-200 bg-white shadow-md overflow-hidden">
              {/* Collapsed Order Summary */}
              <div className="p-4 border-b border-neutral-200">
                <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
                  <CollapsibleTrigger className="w-full" asChild>
                    <button type="button" className="w-full">
                      {compactOrderSummary}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="pt-3 mt-3 border-t border-neutral-100">
                      {orderTotals}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Payment Section */}
              <div className="p-4 space-y-4 border-b border-neutral-200">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-neutral-700">Payment</p>
                  <div className="space-y-2">
                    {settings.paymentMethods
                      .filter((m) => m.enabled)
                      .map((method) => {
                        const isSelected = paymentMethod === method.id;
                        return (
                          <label
                            key={method.id}
                            className={`block rounded-md border px-3 py-2.5 cursor-pointer ${
                              isSelected
                                ? method.id === "mpesa"
                                  ? "border-emerald-600 bg-emerald-50"
                                  : "border-neutral-900 bg-neutral-100"
                                : "border-neutral-200 bg-white"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value={method.id}
                                checked={isSelected}
                                onChange={() => setPaymentMethod(method.id)}
                                className={`h-4 w-4 ${
                                  method.id === "mpesa"
                                    ? "text-emerald-600"
                                    : "text-neutral-900"
                                }`}
                              />
                              <span className="text-sm font-medium">
                                {method.name}
                              </span>
                            </span>
                            {isSelected && method.id === "mpesa" && (
                              <span className="mt-1.5 flex items-center pl-6 text-xs text-neutral-500">
                                Send prompt to&nbsp;
                                <span className="font-medium text-neutral-700">
                                  {form.phone || "your number"}
                                </span>
                                <button
                                  type="button"
                                  onClick={editPhone}
                                  className="ml-1 inline-flex items-center align-middle text-neutral-400 hover:text-neutral-900"
                                  title="Edit phone number"
                                  aria-label="Edit phone number"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            )}
                            {isSelected && method.description && method.id !== "mpesa" && (
                              <span className="mt-1.5 block pl-6 text-xs text-neutral-500">
                                {method.description}
                              </span>
                            )}
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Button Section */}
              <div className="p-4">
                <Button className="w-full h-11 text-base" type="submit" disabled={submitting}>
                  {submitting 
                    ? "Placing Order..." 
                    : paymentMethod === "mpesa"
                      ? `Pay ${settings.currency} ${total.toLocaleString()}`
                      : `Complete order ${settings.currency} ${total.toLocaleString()}`
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    );
  }
