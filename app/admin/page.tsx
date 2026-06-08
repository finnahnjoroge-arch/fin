import OrderStatusBadge from "@/components/admin/order-status-badge";
import StatsCard from "@/components/admin/stats-card";
import { connectDB } from "@/lib/mongodb";
import { AlertTriangle, Calendar, DollarSign, TrendingUp } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const db = await connectDB();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const [
    todaySalesAgg,
    yesterdaySalesAgg,
    totalRevenueAgg,
    pendingOrders,
    activeProducts,
    recentOrders,
    lowStockProducts,
  ] = await Promise.all([
    db.collection("orders").aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]).toArray(),
    db.collection("orders").aggregate([
      { $match: { createdAt: { $gte: startOfYesterday, $lt: startOfToday } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]).toArray(),
    db.collection("orders").aggregate([
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]).toArray(),
    db.collection("orders").countDocuments({ status: { $in: ["pending", "confirmed"] } }),
    db.collection("products").countDocuments({ status: "active" }),
    db.collection("orders").find().sort({ createdAt: -1 }).limit(10).toArray(),
    db.collection("products").find({
      $or: [
        { type: "simple", stock: { $lte: 5, $gt: 0 } },
        { type: "variable", "variants.stock": { $lte: 5, $gt: 0 } },
      ],
    }).limit(10).toArray(),
  ]);

  const salesToday = todaySalesAgg[0]?.total || 0;
  const salesYesterday = yesterdaySalesAgg[0]?.total || 0;
  const totalRevenue = totalRevenueAgg[0]?.total || 0;

  // Populate customer names for recent orders
  const customerIds = recentOrders.map((o) => o.customer).filter(Boolean);
  const customers = customerIds.length
    ? await db.collection("customers").find({ _id: { $in: customerIds } }).toArray()
    : [];
  const customerMap = Object.fromEntries(customers.map((c) => [c._id.toString(), c]));
  const populatedOrders = recentOrders.map((o) => ({
    ...o,
    customer: o.customer ? customerMap[o.customer.toString()] || o.customer : null,
  }));

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl font-bold dark:text-white md:text-2xl">Dashboard</h1>

      <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
        <StatsCard title="Today's Sales" value={salesToday} icon={TrendingUp} prefix="KES" />
        <StatsCard title="Yesterday's Sales" value={salesYesterday} icon={Calendar} prefix="KES" />
        <StatsCard title="Pending Orders" value={pendingOrders} icon={AlertTriangle} />
        <StatsCard title="Total Revenue" value={totalRevenue} icon={DollarSign} prefix="KES" />
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900 md:p-4">
          <h2 className="mb-3 text-base font-semibold dark:text-white md:mb-4 md:text-lg">Recent Orders</h2>
          <div className="space-y-2 md:hidden">
            {populatedOrders.map((order: any) => (
              <div key={order._id.toString()} className="rounded-md border border-neutral-100 p-2.5 dark:border-neutral-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{order.customer?.name || "Guest"}</p>
                    <p className="truncate text-xs text-neutral-500">{order.orderNumber}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">KES {order.total}</p>
                    <p className="text-xs text-neutral-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <OrderStatusBadge status={order.status} />
                  <span className="truncate text-xs text-neutral-500">{order.customer?.phone || order.customer?.email || "No contact"}</span>
                </div>
              </div>
            ))}
            {populatedOrders.length === 0 && (
              <p className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">No orders yet</p>
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="pb-2 text-left font-medium dark:text-white">Order #</th>
                  <th className="pb-2 text-left font-medium dark:text-white">Customer</th>
                  <th className="pb-2 text-left font-medium dark:text-white">Total</th>
                  <th className="pb-2 text-left font-medium dark:text-white">Status</th>
                  <th className="pb-2 text-left font-medium dark:text-white">Date</th>
                </tr>
              </thead>
              <tbody>
                {populatedOrders.map((order: any) => (
                  <tr key={order._id.toString()} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2">{order.orderNumber}</td>
                    <td className="py-2">{order.customer?.name || "Guest"}</td>
                    <td className="py-2">KES {order.total}</td>
                    <td className="py-2"><OrderStatusBadge status={order.status} /></td>
                    <td className="py-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {populatedOrders.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center text-neutral-500">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900 md:p-4">
          <h2 className="mb-3 text-base font-semibold dark:text-white md:mb-4 md:text-lg">Low Stock Alerts</h2>
          <div className="space-y-2 md:hidden">
            {lowStockProducts.map((product: any) => (
              <div key={product._id.toString()} className="rounded-md border border-neutral-100 p-2.5 dark:border-neutral-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{product.name}</p>
                    <p className="truncate text-xs text-neutral-500">{product.sku || "No SKU"}</p>
                  </div>
                  <p className="max-w-28 shrink-0 truncate text-right text-sm font-medium text-red-500">
                    {product.type === "simple"
                      ? product.stock
                      : product.variants
                          .filter((v: any) => v.stock <= 5)
                          .map((v: any) => `${v.name} (${v.stock})`)
                          .join(", ")}
                  </p>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <p className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">All stock levels healthy</p>
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="pb-2 text-left font-medium dark:text-white">Product</th>
                  <th className="pb-2 text-left font-medium dark:text-white">SKU</th>
                  <th className="pb-2 text-left font-medium dark:text-white">Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product: any) => (
                  <tr key={product._id.toString()} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2">{product.name}</td>
                    <td className="py-2">{product.sku || "—"}</td>
                    <td className="py-2 font-medium text-red-500">
                      {product.type === "simple"
                        ? product.stock
                        : product.variants
                            .filter((v: any) => v.stock <= 5)
                            .map((v: any) => `${v.name} (${v.stock})`)
                            .join(", ")}
                    </td>
                  </tr>
                ))}
                {lowStockProducts.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-center text-neutral-500">All stock levels healthy</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


