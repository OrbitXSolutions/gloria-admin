import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { OrdersTableSkeleton } from "@/components/admin/orders-table-skeleton";
import { OrdersTableServer } from "@/components/admin/orders-table-server";

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    paymentMethod?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders and track their status.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/orders/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Link>
        </Button>
      </div>

      <Suspense fallback={<OrdersTableSkeleton />}>
        <OrdersTableServer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
