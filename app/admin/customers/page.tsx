"use client";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const limit = 25;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", page.toString());
    params.set("limit", limit.toString());

    const res = await fetch(`/api/admin/customers?${params.toString()}`);
    const data = await res.json();
    setCustomers(data.customers || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    const res = await fetch(`/api/admin/orders?search=${id}&limit=5`);
    const data = await res.json();
    setOrders(data.orders || []);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === customers.length && customers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map((c) => c._id)));
    }
  };

  const deleteSelected = async () => {
    if (!confirm(`Delete ${selectedIds.size} customer(s)?`)) return;
    setDeleting(true);
    const res = await fetch("/api/admin/customers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    if (res.ok) {
      setSelectedIds(new Set());
      fetchCustomers();
    } else {
      alert("Failed to delete customers");
    }
    setDeleting(false);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold dark:text-white">Customers</h1>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={deleteSelected}
            disabled={deleting}
            className="flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete ({selectedIds.size})
          </button>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="px-4 py-3 text-left font-medium dark:text-white">
                  <input
                    type="checkbox"
                    checked={customers.length > 0 && selectedIds.size === customers.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 dark:bg-neutral-800"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Name</th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Email</th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Phone</th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Orders</th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Total Spent</th>
                <th className="px-4 py-3 text-left font-medium dark:text-white">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  </tr>
                ))
              ) : (
                customers.map((customer) => (
                  <>
                    <tr
                      key={customer._id}
                      className="cursor-pointer border-b border-neutral-100 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
                      onClick={() => toggleExpand(customer._id)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(customer._id)}
                          onChange={() => toggleSelect(customer._id)}
                          className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 dark:bg-neutral-800"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">{customer.name || "—"}</td>
                      <td className="px-4 py-3">{customer.email}</td>
                      <td className="px-4 py-3">{customer.phone || "—"}</td>
                      <td className="px-4 py-3">{customer.orderCount}</td>
                      <td className="px-4 py-3">KES {customer.totalSpent?.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                    {expandedId === customer._id && (
                      <tr>
                        <td colSpan={7} className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800">
                          <h4 className="mb-2 text-sm font-semibold">Recent Orders</h4>
                          {orders.length > 0 ? (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b dark:border-neutral-700">
                                  <th className="pb-1 text-left">Order #</th>
                                  <th className="pb-1 text-left">Total</th>
                                  <th className="pb-1 text-left">Status</th>
                                  <th className="pb-1 text-left">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orders.map((o: any) => (
                                  <tr key={o._id} className="border-b dark:border-neutral-700">
                                    <td className="py-1">{o.orderNumber}</td>
                                    <td className="py-1">KES {o.total}</td>
                                    <td className="py-1 capitalize">{o.status}</td>
                                    <td className="py-1">
                                      {new Date(o.createdAt).toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-neutral-500">No recent orders</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
              {!loading && customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500 dark:text-neutral-400">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
            <p className="text-sm text-neutral-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                className="rounded-md border border-neutral-200 px-3 py-1 text-sm disabled:opacity-50 dark:border-neutral-700"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <button
                className="rounded-md border border-neutral-200 px-3 py-1 text-sm disabled:opacity-50 dark:border-neutral-700"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


