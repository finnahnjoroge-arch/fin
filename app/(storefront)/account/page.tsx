"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  createdAt: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    region: string;
    country: string;
  };
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("customerEmail");
    const storedPhone = localStorage.getItem("customerPhone");

    if (storedEmail && storedPhone) {
      fetchCustomerData(storedEmail, storedPhone);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCustomerData = async (email: string, phone: string) => {
    setLoading(true);
    setSearchError("");

    try {
      const customerRes = await fetch(
        `/api/storefront/account?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`
      );

      if (customerRes.ok) {
        const data = await customerRes.json();
        setCustomer(data.customer);
        setOrders(data.orders || []);
        localStorage.setItem("customerEmail", data.customer.email);
        localStorage.setItem("customerPhone", data.customer.phone);
        localStorage.setItem("customerName", data.customer.name);
      } else {
        setSearchError("Customer not found. Please check your details or place an order first.");
      }
    } catch (error) {
      setSearchError("Failed to fetch customer data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail && !lookupPhone) {
      setSearchError("Please enter your email or phone number");
      return;
    }
    setIsSearching(true);
    await fetchCustomerData(lookupEmail, lookupPhone);
    setIsSearching(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered":
      case "paid":
        return "text-green-600 bg-green-50";
      case "pending":
        return "text-amber-600 bg-amber-50";
      case "processing":
        return "text-blue-600 bg-blue-50";
      case "cancelled":
      case "failed":
        return "text-red-600 bg-red-50";
      default:
        return "text-neutral-600 bg-neutral-100";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          <span className="ml-3 text-neutral-500">Loading your account...</span>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
              <User className="h-8 w-8 text-neutral-600" />
            </div>
            <CardTitle className="text-xl">Welcome to Your Account</CardTitle>
            <CardDescription>
              Enter your email or phone number to view your orders and profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLookup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. 0712345678"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                />
              </div>
              {searchError && (
                <p className="text-sm text-red-600">{searchError}</p>
              )}
              <Button type="submit" className="w-full" disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  "View My Account"
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-500">
                Don&apos;t have an account?{" "}
                <Link href="/shop" className="text-blue-600 hover:underline">
                  Start shopping
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">My Account</h1>
        <p className="text-neutral-500">
          Welcome back, {customer.name || "Valued Customer"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">My Orders</span>
            {orders.length > 0 && (
              <span className="ml-1 rounded-full bg-neutral-900 px-2 py-0.5 text-xs text-white">
                {orders.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-neutral-500" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-neutral-500">Full Name</p>
                  <p className="font-medium">{customer.name || "—"}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </div>
                  <p className="font-medium">{customer.email}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </div>
                  <p className="font-medium">{customer.phone || "—"}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Calendar className="h-4 w-4" />
                    Member Since
                  </div>
                  <p className="font-medium">
                    {customer.createdAt ? formatDate(customer.createdAt) : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-neutral-500" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-neutral-50 p-4 text-center">
                    <p className="text-2xl font-bold text-neutral-900">
                      {orders.length}
                    </p>
                    <p className="text-sm text-neutral-500">Total Orders</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 p-4 text-center">
                    <p className="text-2xl font-bold text-neutral-900">
                      {orders.filter((o) => o.status === "delivered").length}
                    </p>
                    <p className="text-sm text-neutral-500">Delivered</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 p-4 text-center">
                    <p className="text-2xl font-bold text-neutral-900">
                      {orders.filter((o) => o.status === "pending").length}
                    </p>
                    <p className="text-sm text-neutral-500">Pending</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      KES{" "}
                      {orders
                        .reduce((sum, o) => sum + (o.total || 0), 0)
                        .toLocaleString()}
                    </p>
                    <p className="text-sm text-neutral-500">Total Spent</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveTab("orders")}
                >
                  View All Orders
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-16 w-16 text-neutral-300" />
                <h3 className="mt-4 text-lg font-semibold">No orders yet</h3>
                <p className="text-neutral-500">
                  You haven&apos;t placed any orders yet.
                </p>
                <Link href="/shop">
                  <Button className="mt-4">Start Shopping</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order._id} className="overflow-hidden">
                <CardHeader className="bg-neutral-50/50 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-neutral-500">Order Number</p>
                      <p className="font-semibold">{order.orderNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-neutral-500">Order Date</p>
                      <p className="font-medium">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusColor(
                          order.paymentStatus
                        )}`}
                      >
                        Payment: {order.paymentStatus}
                      </span>
                    </div>
                    <p className="font-bold">
                      Total: KES {order.total?.toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {order.items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 rounded-lg bg-neutral-50 p-3"
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-md bg-white">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full rounded-md object-cover"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-neutral-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-neutral-500">
                            Qty: {item.quantity} × KES{" "}
                            {item.price?.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-semibold">
                          KES {(item.price * item.quantity)?.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {order.shippingAddress && (
                    <div className="mt-4 rounded-lg bg-neutral-50 p-4">
                      <p className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
                        <MapPin className="h-4 w-4" />
                        Delivery Address
                      </p>
                      <p className="text-sm text-neutral-600">
                        {order.shippingAddress.fullName}
                        <br />
                        {order.shippingAddress.phone}
                        <br />
                        {order.shippingAddress.address}
                        <br />
                        {order.shippingAddress.city}, {order.shippingAddress.region}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}