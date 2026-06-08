"use client";

import OrderStatusBadge from "@/components/admin/order-status-badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Copy } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const orderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data);
        setAdminNotes(data.adminNotes || "");
        setLoading(false);
      });
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (res.ok) {
      setOrder(data);
      toast.success(`Status updated to ${newStatus}`);
    }
    setSaving(false);
  };

  const updatePaymentStatus = async (newStatus: string) => {
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: newStatus }),
    });
    const data = await res.json();
    if (res.ok) {
      setOrder(data);
      toast.success(`Payment status updated to ${newStatus}`);
    }
    setSaving(false);
  };

  const saveAdminNotes = async () => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNotes }),
    });
    const data = await res.json();
    if (res.ok) {
      setOrder(data);
      toast.success("Notes saved");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) return <div>Order not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="mb-3 text-lg font-semibold">Customer</h2>
        <div className="space-y-1 text-sm">
          <p className="font-medium">{order.customer?.name || "Guest"}</p>
          <p className="text-neutral-500">{order.customer?.email}</p>
          <div className="flex items-center gap-2 text-neutral-500">
            <p>{order.customer?.phone}</p>
            {order.customer?.phone && (
              <button
                onClick={() => copyToClipboard(order.customer.phone, "customerPhone")}
                className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                title="Copy phone"
              >
                {copiedField === "customerPhone" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-only Delivery Details */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4 lg:hidden dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="mb-3 text-lg font-semibold">Delivery Details</h2>
        <div className="space-y-1 text-sm">
          <p className="font-medium">{order.shippingAddress?.fullName}</p>
          <div className="flex items-center gap-2">
            <p>{order.shippingAddress?.address}</p>
            {order.shippingAddress?.address && (
              <button
                onClick={() => copyToClipboard(order.shippingAddress.address, "address")}
                className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                title="Copy address"
              >
                {copiedField === "address" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
          <p>
            {order.shippingAddress?.city}, {order.shippingAddress?.region}
          </p>
          <p>{order.shippingAddress?.country}</p>
          <div className="flex items-center gap-2 text-neutral-500">
            <p>{order.shippingAddress?.phone}</p>
            {order.shippingAddress?.phone && (
              <button
                onClick={() => copyToClipboard(order.shippingAddress.phone, "phone")}
                className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                title="Copy phone"
              >
                {copiedField === "phone" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
          {order.shippingAddress?.notes && (
            <p className="mt-2 italic text-neutral-500">{order.shippingAddress.notes}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-semibold">Items</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-neutral-700">
                  <th className="pb-2 text-left">Product</th>
                  <th className="pb-2 text-left">Variant</th>
                  <th className="pb-2 text-left">SKU</th>
                  <th className="pb-2 text-left">Qty</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: any, i: number) => (
                  <tr key={i} className="border-b dark:border-neutral-800">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img src={item.image} alt="" className="h-10 w-10 rounded object-cover" />
                        )}
                        <span className="line-clamp-2">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3">{item.variantId || "—"}</td>
                    <td className="py-3">{item.sku || "—"}</td>
                    <td className="py-3">{item.quantity}</td>
                    <td className="py-3 text-right font-medium">
                      KES {(item.quantity * item.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-semibold">Status Timeline</h2>
            <div className="space-y-4">
              {(order.statusHistory || []).map((entry: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    {i < (order.statusHistory || []).length - 1 && (
                      <div className="mt-1 h-full w-0.5 bg-neutral-200 dark:bg-neutral-700" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium capitalize">{entry.status}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(entry.changedAt).toLocaleString()}
                    </p>
                    {entry.note && <p className="mt-1 text-sm text-neutral-600">{entry.note}</p>}
                  </div>
                </div>
              ))}
              {(order.statusHistory || []).length === 0 && (
                <p className="text-neutral-500">No status history yet</p>
              )}
            </div>
          </div>

        </div>

        <div className="space-y-6">
          <div className="hidden rounded-lg border border-neutral-200 bg-white p-4 lg:block dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="mb-3 text-lg font-semibold">Delivery Details</h2>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{order.shippingAddress?.fullName}</p>
              <div className="flex items-center gap-2">
                <p>{order.shippingAddress?.address}</p>
                {order.shippingAddress?.address && (
                  <button
                    onClick={() => copyToClipboard(order.shippingAddress.address, "address")}
                    className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    title="Copy address"
                  >
                    {copiedField === "address" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.region}
              </p>
              <p>{order.shippingAddress?.country}</p>
              <div className="flex items-center gap-2 text-neutral-500">
                <p>{order.shippingAddress?.phone}</p>
                {order.shippingAddress?.phone && (
                  <button
                    onClick={() => copyToClipboard(order.shippingAddress.phone, "phone")}
                    className="shrink-0 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    title="Copy phone"
                  >
                    {copiedField === "phone" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
              {order.shippingAddress?.notes && (
                <p className="mt-2 italic text-neutral-500">{order.shippingAddress.notes}</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-semibold">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span>KES {order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Delivery Cost</span>
                <span>KES {order.shippingCost}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 dark:border-neutral-700">
                <span className="font-medium">Total</span>
                <span className="font-bold">KES {order.total}</span>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Order Status</label>
                <Select value={order.status} onValueChange={updateStatus} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Payment Status</label>
                <Select
                  value={order.paymentStatus}
                  onValueChange={updatePaymentStatus}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="collected">Collected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="mb-3 text-lg font-semibold">Admin Notes</h2>
        <textarea
          className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          rows={4}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          onBlur={saveAdminNotes}
          placeholder="Add internal notes about this order..."
        />
      </div>
    </div>
  );
}
