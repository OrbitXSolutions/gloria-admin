import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { createSsrClient } from "@/lib/supabase/server"
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Eye, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import { getProductImageUrl } from "@/lib/constants/supabase-storage"
import { formatPrice } from "@/lib/utils/format-price"

async function getDashboardStats() {
  const supabase = await createSsrClient();

  const [{ count: productsCount }, { count: ordersCount }, { count: usersCount }, { data: recentOrders }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }).eq("is_deleted", false),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("is_deleted", false),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("is_deleted", false),
      supabase
        .from("orders")
        .select(`
        *,
        user:users(first_name, last_name, email),
        order_items(
          quantity,
          price,
          product:products(name_en, primary_image, currency_code)
        )
      `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  // Calculate total revenue from orders
  const { data: orderTotals } = await supabase
    .from("orders")
    .select("total_price")
    .eq("is_deleted", false)
    .not("total_price", "is", null)

  const totalRevenue = orderTotals?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0

  return {
    productsCount: productsCount || 0,
    ordersCount: ordersCount || 0,
    usersCount: usersCount || 0,
    totalRevenue,
    recentOrders: recentOrders || [],
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

async function DashboardContent() {
  const stats = await getDashboardStats()

  const statCards = [
    {
      title: "Total Products",
      value: stats.productsCount.toLocaleString(),
      description: "Active products in store",
      icon: Package,
      trend: "+12% from last month",
      href: "/admin/products",
    },
    {
      title: "Total Orders",
      value: stats.ordersCount.toLocaleString(),
      description: "Orders received",
      icon: ShoppingCart,
      trend: "+8% from last month",
      href: "/admin/orders",
    },
    {
      title: "Total Users",
      value: stats.usersCount.toLocaleString(),
      description: "Registered customers",
      icon: Users,
      trend: "+15% from last month",
      href: "/admin/users",
    },
    {
      title: "Total Revenue",
      value: `${formatPrice(stats.totalRevenue, { code: 'AED', symbol_en: 'AED' }, 'en')}`,
      description: "Total sales revenue",
      icon: DollarSign,
      trend: "+22% from last month",
      href: "/admin/orders",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "processing":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "shipped":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href} className="block">
            <Card className="relative overflow-hidden hover:bg-accent/30 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{stat.trend}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders from your customers</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/orders">
              <Eye className="mr-2 h-4 w-4" />
              View All
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order: any) => {
                  const itemsCount = order.order_items?.length || 0
                  return (
                    <tr
                      key={order.id}
                      className="group border-t hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-3 align-top min-w-[160px]">
                        <Link href={`/admin/orders/${order.code || order.id}`} className="font-medium hover:underline">
                          #{order.code || order.id}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-1">
                          {order.created_at && formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <div className="font-medium">
                          {order.user?.first_name} {order.user?.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">{order.user?.email}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {order.order_items?.slice(0, 3).map((item: any, index: number) => (
                              <div key={index} className="relative h-8 w-8 rounded border bg-muted overflow-hidden">
                                <Image
                                  src={getProductImageUrl(item.product?.primary_image) || '/placeholder.svg'}
                                  alt={item.product?.name_en || 'Product'}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ))}
                            {itemsCount > 3 && (
                              <div className="flex h-8 w-8 items-center justify-center rounded border bg-muted text-[10px] font-medium">
                                +{itemsCount - 3}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground max-w-[140px] truncate">
                            {order.order_items?.[0]?.product?.name_en}
                            {itemsCount > 1 && ` +${itemsCount - 1} more`}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <div className="font-medium">
                          {formatPrice(order.total_price, { code: order.order_items?.[0]?.product?.currency_code }, 'en')}
                        </div>
                        {order.shipping && order.shipping > 0 && (
                          <div className="text-[10px] text-muted-foreground">incl. shipping</div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Badge className={getStatusColor(order.status || 'pending')}>{order.status || 'pending'}</Badge>
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/orders/${order.code || order.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
                {stats.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No recent orders
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your store.</p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
