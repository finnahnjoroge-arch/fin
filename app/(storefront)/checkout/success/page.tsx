"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackPurchase } from "lib/meta-pixel";
import { CircleCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Suspense, useEffect, useRef, useState } from "react";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  // CheckoutRequestID passed from the checkout form (M-Pesa only).
  const initialCheckoutRequestId = searchParams.get("checkoutRequestId");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Live M-Pesa payment state for this order, resolved via polling.
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "failed" | null>(null);
  const [mpesaResult, setMpesaResult] = useState<any>(null); // receipt / resultDesc from status route
  const [pollStopped, setPollStopped] = useState(false); // true once we hit a final state or timeout

  // Polling configuration — mirrors the /mpesa-test page behaviour.
  const POLL_INTERVAL_MS = 3000; // poll every 3 seconds
  const POLL_TIMEOUT_MS = 60 * 1000; // stop after 60 seconds
  const FINAL_STATUSES = ["paid", "failed"];

  // Keep track of the latest checkoutRequestId in a ref so the poll interval
  // can read it without re-creating itself on every render.
  const checkoutRequestIdRef = useRef<string | null>(initialCheckoutRequestId ?? null);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/storefront/orders/${orderId}`)
        .then((r) => r.json())
        .then((data) => {
          setOrder(data);
          setLoading(false);

          // If we didn't get the CheckoutRequestID from the URL, fall back to
          // the one stored on the Order document.
          if (!checkoutRequestIdRef.current && data?.mpesaCheckoutRequestId) {
            checkoutRequestIdRef.current = data.mpesaCheckoutRequestId;
          }

          // Seed the initial payment state from the Order's paymentStatus
          // (e.g. if the callback already fired before the page loaded).
          if (data?.paymentStatus === "paid" || data?.paymentStatus === "failed") {
            setPaymentStatus(data.paymentStatus);
          } else if (data?.paymentMethod === "mpesa") {
            setPaymentStatus("pending");
          }

          if (data && data.items && data.total !== undefined) {
            const contentIds = data.items
              .map((item: any) => {
                const id = item.sku || item.variantId || item.product;
                return id ? String(id) : "";
              })
              .filter(Boolean);
            const numItems = data.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
            trackPurchase({
              content_ids: contentIds,
              content_type: "product",
              value: Number(data.total),
              currency: "KES",
              num_items: numItems,
              order_id: data.orderNumber || orderId || undefined,
            });
          }
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId]);

  // Poll the M-Pesa status endpoint while the order's payment is pending.
  // Mirrors the polling in /mpesa-test: every POLL_INTERVAL_MS, stop on a
  // final status or after POLL_TIMEOUT_MS.
  useEffect(() => {
    // Only poll for M-Pesa orders whose payment hasn't been resolved yet.
    if (paymentStatus !== "pending" || pollStopped) return;
    const checkoutId = checkoutRequestIdRef.current;
    if (!checkoutId) return;

    const startedAt = Date.now();

    const pollOnce = async () => {
      try {
        const res = await fetch(`/api/mpesa/status/${encodeURIComponent(checkoutId)}`);
        const data = await res.json();
        if (res.ok && data.status) {
          // The status route returns { status, resultDesc, mpesaReceiptNumber }.
          if (data.status === "success") {
            setPaymentStatus("paid");
            setMpesaResult(data);
            setPollStopped(true);
            clearInterval(interval);
          } else if (data.status === "failed" || data.status === "timeout") {
            setPaymentStatus("failed");
            setMpesaResult(data);
            setPollStopped(true);
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("Order M-Pesa status poll error:", err);
      }
    };

    // Poll immediately, then on the interval.
    pollOnce();

    const interval = setInterval(() => {
      // Hard stop after the 60-second budget regardless of state.
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setPollStopped(true);
        setPaymentStatus((prev) => (prev === "pending" ? "failed" : prev));
        // If we give up while still pending, show a friendly message.
        setMpesaResult({ resultDesc: "Payment status did not resolve within the allowed window. Please check later." });
        clearInterval(interval);
        return;
      }
      if (pollStopped || paymentStatus !== "pending") {
        clearInterval(interval);
        return;
      }
      pollOnce();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
    // Minimal deps: re-run only when the underlying payment state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStatus, pollStopped]);


  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <p className="text-neutral-500">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <p className="text-lg text-neutral-500">Order not found.</p>
        <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid gap-8 md:grid-cols-2 items-start">
        <div className="space-y-8">








                    <Card>
            <CardContent className="p-6 flex items-center gap-3">
              <CircleCheck className="text-green-600 h-12 w-12" />
              <div>
                <h2 className="text-sm text-neutral-500">Order #{order.orderNumber}</h2>
                <p className="text-xl font-medium">
                  {paymentStatus === "pending"
                    ? "Your order has been placed!"
                    : "Order placed successfully!"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* M-Pesa payment status (only shown for M-Pesa orders) */}
          {order.paymentMethod === "mpesa" && (
            <Card>
              <CardContent className="p-6">
                {paymentStatus === "pending" && (
                  <div className="flex items-center gap-3 text-amber-700">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-t-amber-600" />
                    <div>
                      <p className="text-sm font-semibold">
                        Waiting for payment...
                      </p>
                      <p className="text-xs text-amber-600">
                        Check your phone for the M-Pesa STK push prompt and enter your PIN.
                      </p>
                    </div>
                  </div>
                )}
                {paymentStatus === "paid" && (
                  <div className="text-green-700">
                    <p className="text-sm font-semibold">✅ Payment successful!</p>
                    {mpesaResult?.mpesaReceiptNumber && (
                      <p className="mt-1 text-sm">
                        M-Pesa Receipt:{" "}
                        <span className="font-mono font-semibold">
                          {mpesaResult.mpesaReceiptNumber}
                        </span>
                      </p>
                    )}
                    {mpesaResult?.resultDesc && (
                      <p className="mt-1 text-xs text-green-600">{mpesaResult.resultDesc}</p>
                    )}
                  </div>
                )}
                {paymentStatus === "failed" && (
                  <div className="text-red-700">
                    <p className="text-sm font-semibold">Payment failed or not completed.</p>
                    {mpesaResult?.resultDesc && (
                      <p className="mt-1 text-sm text-red-600">{mpesaResult.resultDesc}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Payment Method</span>
                <span className="font-medium">
                  {order.paymentMethod === "mpesa" ? "M-Pesa" : "Cash on Delivery"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Payment Status</span>
                <span className="font-medium capitalize">{order.paymentStatus || "pending"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Status</span>
                <span className="font-medium capitalize">{order.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Total</span>
                <span className="font-medium">KES {order.total.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>




















              <CardTitle>Delivery Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.address}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.region}</p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.notes && (
                <p className="text-neutral-500 italic">{order.shippingAddress.notes}</p>
              )}
            </CardContent>
          </Card>

          <Link href="/">
            <Button className="w-full gap-2">
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Items Ordered</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-neutral-500">Qty: {item.quantity}</p>
                </div>
                <span className="font-medium">KES {(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>KES {order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Cost</span>
                <span>KES {(order.shippingCost || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>KES {order.total.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-center text-xs text-neutral-500">
              Our team will contact you shortly to confirm delivery.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-4 md:p-8 text-center">
        <p className="text-neutral-500">Loading order details...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
