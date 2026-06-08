"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackPurchase } from "lib/meta-pixel";
import { CircleCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/storefront/orders/${orderId}`)
        .then((r) => r.json())
        .then((data) => {
          setOrder(data);
          setLoading(false);

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
                <p className="text-xl font-medium">Your order has been placed!</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Payment Method</span>
                <span className="font-medium">Cash on Delivery</span>
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
