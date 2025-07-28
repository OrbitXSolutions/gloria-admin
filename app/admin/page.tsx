import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { createSsrClient } from "@/lib/supabase/server"
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Eye, MoreHorizontal } from "lucide-react"
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
    },
    {
      title: "Total Orders",
      value: stats.ordersCount.toLocaleString(),
      description: "Orders received",
      icon: ShoppingCart,
      trend: "+8% from last month",
    },
    {
      title: "Total Users",
      value: stats.usersCount.toLocaleString(),
      description: "Registered customers",
      icon: Users,
      trend: "+15% from last month",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      description: "Total sales revenue",
      icon: DollarSign,
      trend: "+22% from last month",
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
          <Card key={stat.title} className="relative overflow-hidden">
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
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders from your customers</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex -space-x-2">
                    {order.order_items?.slice(0, 3).map((item: any, index: number) => (
                      <div
                        key={index}
                        className="relative h-10 w-10 rounded border-2 border-background overflow-hidden"
                      >
                        <Image
                          src={getProductImageUrl(item.product?.primary_image) || "/placeholder.svg"}
                          alt={item.product?.name_en || "Product"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                    {(order.order_items?.length || 0) > 3 && (
                      <div className="flex h-10 w-10 items-center justify-center rounded border-2 border-background bg-muted text-xs font-medium">
                        +{(order.order_items?.length || 0) - 3}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Order #{order.code || order.id}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.user?.first_name} {order.user?.last_name} •{" "}
                      {order.created_at && formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge className={getStatusColor(order.status || "pending")}>{order.status || "pending"}</Badge>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatPrice(
                        order.total_price,
                        {
                          code: order.order_items?.[0]?.product?.currency_code,
                        },
                        'en'
                      )}
                    </p>
                    {order.shipping && order.shipping > 0 && (
                      <p className="text-xs text-muted-foreground">
                        incl. shipping
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">{order.order_items?.length || 0} items</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
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
