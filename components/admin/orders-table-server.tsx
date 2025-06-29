/**
 * Server component – fetches data with Supabase (cookies() allowed here) and
 * delegates all interactive behaviour to the client component.
 */
import { createSsrClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { OrdersTableSkeleton } from "./orders-table-skeleton";
import type { Database } from "@/lib/types/database.types";
import { OrdersTableClient } from "./orders-table-client";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type PaymentMethod = Database["public"]["Enums"]["payment_method"];

interface OrdersServerProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    paymentMethod?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

async function getOrders({
  page = 1,
  search = "",
  status = "",
  paymentMethod = "",
  sortBy = "created_at",
  sortOrder = "desc",
  pageSize = 10,
}: {
  page?: number;
  search?: string;
  status?: string;
  paymentMethod?: string;
  sortBy?: string;
  sortOrder?: string;
  pageSize?: number;
}) {
  const supabase = await createSsrClient();

  let query = supabase
    .from("orders")
    .select(
      `
      *,
      user:users(first_name, last_name, email),
      order_items(
        quantity,
        price,
        product:products(name_en)
      )
    `,
      { count: "exact" }
    )
    .eq("is_deleted", false);

  // Apply filters
  if (search) {
    query = query.or(
      `code.ilike.%${search}%,user.email.ilike.%${search}%,user.first_name.ilike.%${search}%,user.last_name.ilike.%${search}%`
    );
  }

  if (status) {
    query = query.eq("status", status as OrderStatus);
  }

  if (paymentMethod) {
    query = query.eq("payment_method", paymentMethod as PaymentMethod);
  }

  // Apply sorting
  const ascending = sortOrder === "asc";

  // Map sortBy fields to actual database columns
  const sortMapping: Record<string, string> = {
    code: "code",
    customer: "user.first_name",
    total: "total_price",
    status: "status",
    payment: "payment_method",
    created_at: "created_at",
  };

  const sortColumn = sortMapping[sortBy] || "created_at";
  query = query.order(sortColumn, { ascending });

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Error fetching orders:", error);
    return { orders: [], count: 0 };
  }

  return { orders: data ?? [], count: count ?? 0 };
}

async function getStatusCounts() {
  const supabase = await createSsrClient();
  const { data } = await supabase
    .from("orders")
    .select("status")
    .eq("is_deleted", false);

  const counts: Record<string, number> = {};
  data?.forEach(({ status }) => {
    if (status) counts[status] = (counts[status] || 0) + 1;
  });

  return counts;
}

export async function OrdersTableServer({ searchParams }: OrdersServerProps) {
  const resolvedSearchParams = await searchParams;

  const page = parseInt(resolvedSearchParams?.page || "1");
  const search = resolvedSearchParams?.search || "";
  const status = resolvedSearchParams?.status || "";
  const paymentMethod = resolvedSearchParams?.paymentMethod || "";
  const sortBy = resolvedSearchParams?.sortBy || "created_at";
  const sortOrder = resolvedSearchParams?.sortOrder || "desc";

  const [{ orders, count }, statusCounts] = await Promise.all([
    getOrders({ page, search, status, paymentMethod, sortBy, sortOrder }),
    getStatusCounts(),
  ]);

  // Map nulls to undefined for type compatibility
  const mappedOrders = orders.map((order: any) => ({
    ...order,
    user: order.user === null ? undefined : order.user,
    order_items: order.order_items === null ? undefined : order.order_items,
  }));

  return (
    <Suspense fallback={<OrdersTableSkeleton />}>
      <OrdersTableClient
        orders={mappedOrders}
        statusCounts={statusCounts}
        pagination={{
          page,
          pageSize: 10,
          total: count,
        }}
        filters={{
          search,
          status,
          paymentMethod,
        }}
        sorting={{
          sortBy,
          sortOrder,
        }}
      />
    </Suspense>
  );
}
