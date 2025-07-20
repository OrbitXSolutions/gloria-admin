import { notFound } from "next/navigation";
import { createSsrClient } from "@/lib/supabase/server";
import { OrderDetails } from "@/components/admin/order-details";
import type { OrderWithItems } from "@/lib/types/database.types";

interface OrderDetailsPageProps {
    params: {
        code: string;
    };
}

async function getOrderByCode(code: string): Promise<OrderWithItems | null> {
    const supabase = await createSsrClient();

    // First, get the order with basic info
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
      *,
      user:users(*),
      address:addresses(*),
      order_history:order_history(*)
    `)
        .eq("code", code)
        .eq("is_deleted", false)
        .single();

    if (orderError || !order) {
        return null;
    }

    // Get order items with product details
    const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(`
      *,
      product:products(*)
    `)
        .eq("order_id", order.id)
        .eq("is_deleted", false);

    if (itemsError) {
        console.error("Error fetching order items:", itemsError);
    }

    // Get invoice if exists
    const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("order_code", code)
        .eq("is_deleted", false)
        .single();

    if (invoiceError && invoiceError.code !== "PGRST116") {
        console.error("Error fetching invoice:", invoiceError);
    }

    // Combine all data
    const orderWithItems: OrderWithItems = {
        ...order,
        order_items: orderItems || [],
        user: order.user || undefined,
        address: order.address || undefined,
        order_history: order.order_history || [],
        invoice: invoice || undefined,
    };

    return orderWithItems;
}

export default async function OrderDetailsPage({
    params,
}: OrderDetailsPageProps) {
    const order = await getOrderByCode(params.code);

    if (!order) {
        notFound();
    }

    return <OrderDetails order={order} />;
} 