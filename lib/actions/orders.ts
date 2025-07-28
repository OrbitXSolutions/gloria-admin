"use server";

import { createSsrClient } from "@/lib/supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { sendOrderStatusUpdateEmails } from "./send-order-status-emails";
import type { OrderWithItems } from "@/lib/types/database.types";
import { actionClient } from "../common/safe-action";
// Schema for updating order status
const updateOrderStatusSchema = z.object({
    orderId: z.number(),
    newStatus: z.enum([
        "draft",
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "failed",
        "refunded",
        "returned"
    ]),
    adminNote: z.string().optional(),
    changedBy: z.string().optional(),
});

// Schema for updating order details
const updateOrderSchema = z.object({
    id: z.number(),
    status: z.enum([
        "draft",
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "failed",
        "refunded",
        "returned"
    ]).optional(),
    admin_note: z.string().optional(),
    user_note: z.string().optional(),
    payment_method: z.enum(["cash", "card"]).optional(),
    total_price: z.number().optional(),
    subtotal: z.number().optional(),
    shipping: z.number().optional(),
});

// Helper function to get order with all related data
async function getOrderWithDetails(orderId: number): Promise<OrderWithItems | null> {
    const supabase = await createSsrClient();

    const { data, error } = await supabase
        .from("orders")
        .select(`
      *,
      user:users(first_name, last_name, email, phone),
      order_items(
        id,
        quantity,
        price,
        product:products(
          id,
          name_en,
          name_ar,
          sku,
          currency_code
        )
      ),
      address:addresses(*)
    `)
        .eq("id", orderId)
        .eq("is_deleted", false)
        .single();

    if (error) {
        console.error("Error fetching order:", error);
        return null;
    }

    return data as OrderWithItems;
}

// Update order status with email notifications
export const updateOrderStatus = actionClient
    .inputSchema(updateOrderStatusSchema)
    .action(async ({ parsedInput }) => {
        const { orderId, newStatus, adminNote, changedBy } = parsedInput;
        const supabase = await createSsrClient();

        // First, get the current order to get the previous status
        const currentOrder = await getOrderWithDetails(orderId);
        if (!currentOrder) {
            throw new Error("Order not found");
        }

        const previousStatus = currentOrder.status || "pending";

        // Update the order status
        const { data: updatedOrder, error } = await supabase
            .from("orders")
            .update({
                status: newStatus,
                admin_note: adminNote,
                updated_at: new Date().toISOString(),
                updated_by: changedBy,
            })
            .eq("id", orderId)
            .eq("is_deleted", false)
            .select()
            .single();

        if (error) {
            console.error("Error updating order status:", error);
            throw new Error("Failed to update order status");
        }

        // Add to order history
        await supabase
            .from("order_history")
            .insert({
                order_id: orderId,
                status: newStatus,
                note: adminNote,
                changed_by: changedBy,
                changed_at: new Date().toISOString(),
            });

        // Send email notifications if customer information is available
        if (currentOrder.user?.email) {
            const customerName = `${currentOrder.user.first_name || ""} ${currentOrder.user.last_name || ""}`.trim() || "Customer";

            try {
                await sendOrderStatusUpdateEmails({
                    order: currentOrder,
                    previousStatus,
                    newStatus,
                    customerName,
                    customerEmail: currentOrder.user.email,
                    adminNote,
                    changedBy,
                });
            } catch (emailError) {
                console.error("Error sending status update emails:", emailError);
                // Don't throw error here - order status was updated successfully
                // Email failure shouldn't prevent the status update
            }
        }

        revalidatePath("/admin/orders");
        revalidatePath(`/admin/orders/${orderId}`);

        return {
            success: true,
            data: updatedOrder,
            previousStatus,
            newStatus
        };
    });

// Update order details (without email notifications)
export const updateOrder = actionClient
    .inputSchema(updateOrderSchema)
    .action(async ({ parsedInput }) => {
        const { id, ...updateData } = parsedInput;
        const supabase = await createSsrClient();

        const { data, error } = await supabase
            .from("orders")
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("is_deleted", false)
            .select()
            .single();

        if (error) {
            console.error("Error updating order:", error);
            throw new Error("Failed to update order");
        }

        revalidatePath("/admin/orders");
        revalidatePath(`/admin/orders/${id}`);

        return { success: true, data };
    });

// Delete order (soft delete)
export const deleteOrder = actionClient
    .inputSchema(z.object({ id: z.number() }))
    .action(async ({ parsedInput }) => {
        const { id } = parsedInput;
        const supabase = await createSsrClient();

        const { error } = await supabase
            .from("orders")
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
            console.error("Error deleting order:", error);
            throw new Error("Failed to delete order");
        }

        revalidatePath("/admin/orders");
        return { success: true };
    });

// Get order by ID with all related data
export const getOrderById = actionClient
    .inputSchema(z.object({ id: z.number() }))
    .action(async ({ parsedInput }) => {
        const { id } = parsedInput;
        const order = await getOrderWithDetails(id);

        if (!order) {
            throw new Error("Order not found");
        }

        return { success: true, data: order };
    }); 