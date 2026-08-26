"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "components/cart/cart-context";
import Price from "components/price";
import { PageSpinner } from "components/spinner";
import { Pencil } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNotes, setShowNotes] = useState(false);
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



    return (

    <div className="grid gap-6 md:gap-8 md:grid-cols-2 items-start">



























































































































            <form onSubmit={handleSubmit} className="space-y-4 min-w-0">
        {errors.form && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
            {errors.form}
          </div>
        )}






                {/* Delivery Information Card */}
                <div className="rounded-none md:rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="space-y-4 p-4 flex-1">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="John Doe"
              />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
            </div>





























                        <div className="grid gap-4 grid-cols-2">
                                                    <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                              id="phoneInput"
                              value={form.phone}
                              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                              placeholder="0712345678"
                            />
                            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label>City</Label>
                            <Input
                              value={form.city}
                              onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                              placeholder="Nairobi"
                            />
                            {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
                          </div>
                        </div>
                                    <div className="space-y-2">
                          <Label>Email (optional)</Label>
                          <Input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                            placeholder="john@example.com"
                          />
                        </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <textarea

                className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-950 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300"
                rows={2}
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="123 Main St"
              />
              {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="addNote"
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 text-black focus:ring-black"
                checked={showNotes}
                onChange={(e) => setShowNotes(e.target.checked)}
              />
              <label htmlFor="addNote" className="text-sm text-neutral-600 cursor-pointer">
                Add order notes (optional)
              </label>
            </div>
                        {showNotes && (
              <div className="space-y-2">
                <Label>Delivery Notes</Label>
                <textarea
                  className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Leave at the gate"
                />
              </div>
            )}
          </div>

                    <div className="border-t border-neutral-200 p-4 space-y-4">
            {/* Payment method selection */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
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
                              : "border-neutral-900 bg-neutral-50"
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

            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? "Placing Order..." : "Place Order"}
            </Button>
            <p className="mt-2 text-center text-xs text-neutral-500">
              {settings.paymentMethods.find((m) => m.id === paymentMethod)
                ?.description ||
                (paymentMethod === "mpesa"
                  ? "You'll receive an M-Pesa prompt on your phone after placing your order."
                  : "Pay on delivery.")}
            </p>
          </div>
        </div>
      </form>


























































            {/* Order Summary - compact */}

      <div className="rounded-lg border border-neutral-200 bg-white shadow-sm min-w-0 overflow-hidden">
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 className="text-base font-semibold text-neutral-900">Order Summary</h2>
        </div>
        <div className="divide-y divide-neutral-100 px-4 py-2">
          {cart.lines.map((line, i) => (

            <div key={i} className="flex items-center gap-3 py-2 min-w-0">
              <div className="relative h-12 w-12 flex-none overflow-hidden rounded border border-neutral-200 bg-neutral-50">
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
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {line.merchandise.product.title}
                </p>
                <p className="text-xs text-neutral-500">Qty: {line.quantity}</p>
              </div>
              <Price
                className="flex-none text-sm text-neutral-900"
                amount={line.cost.totalAmount.amount}
                currencyCode={line.cost.totalAmount.currencyCode}
              />
            </div>
          ))}
        </div>
        <div className="border-t border-neutral-100 px-4 py-3 space-y-1.5 text-sm">
          {settings.shippingNote && (
            <p className="text-xs text-neutral-500">{settings.shippingNote}</p>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-600">Subtotal</span>
            <Price amount={subtotal.toString()} currencyCode={cart.cost.subtotalAmount.currencyCode} />
          </div>
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
      </div>
    </div>
  );
}
