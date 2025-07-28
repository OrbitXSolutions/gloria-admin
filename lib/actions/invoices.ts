"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSsrClient } from "@/lib/supabase/server";
import { invoiceSchema } from "@/lib/validations/invoice";
import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";

const action = createSafeActionClient();

// --- DATA QUERIES ---

export interface InvoicesListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getInvoices(params: InvoicesListParams = {}) {
  const { page = 1, limit = 10, search = "" } = params;

  const supabase = await createSsrClient();

  let query = supabase
    .from("invoices")
    .select(`
      *,
      order:orders(
        order_items(
          product:products(currency_code)
        )
      )
    `, { count: "exact" })
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `code.ilike.%${search}%,user_name.ilike.%${search}%,user_email.ilike.%${search}%,order_code.ilike.%${search}%`
    );
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Error fetching invoices:", error);
    throw new Error("Failed to fetch invoices.");
  }

  return {
    invoices: data || [],
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function getInvoiceById(id: number) {
  const supabase = await createSsrClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (error) {
    console.error(`Error fetching invoice ${id}:`, error);
    throw new Error("Failed to fetch invoice.");
  }

  return data;
}

// --- MUTATIONS ---

export const createInvoice = action
  .inputSchema(invoiceSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createSsrClient();

    const { data, error } = await supabase
      .from("invoices")
      .insert(parsedInput)
      .select()
      .single();

    if (error) {
      console.error("Error creating invoice:", error);
      throw new Error("Failed to create invoice.");
    }

    revalidatePath("/admin/invoices");
    redirect(`/admin/invoices/${data.id}`);
  });

export const updateInvoice = action
  .inputSchema(invoiceSchema.extend({ id: z.number() }))
  .action(async ({ parsedInput }) => {
    const { id, ...updateData } = parsedInput;
    const supabase = await createSsrClient();

    const { data, error } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating invoice ${id}:`, error);
      throw new Error("Failed to update invoice.");
    }

    revalidatePath("/admin/invoices");
    revalidatePath(`/admin/invoices/${id}`);
    return { success: true, data };
  });

export const deleteInvoice = action
  .inputSchema(z.object({ id: z.number() }))
  .action(async ({ parsedInput: { id } }) => {
    const supabase = await createSsrClient();

    const { error } = await supabase
      .from("invoices")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error(`Error deleting invoice ${id}:`, error);
      throw new Error("Failed to delete invoice.");
    }

    revalidatePath("/admin/invoices");
    return { success: true };
  });

export const duplicateInvoice = action
  .inputSchema(z.object({ id: z.number() }))
  .action(async ({ parsedInput: { id } }) => {
    const supabase = await createSsrClient();

    // 1. Get the original invoice
    const { data: original, error: fetchError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !original) {
      throw new Error("Original invoice not found.");
    }

    // 2. Create a copy, removing unique/temporal fields
    const {
      id: originalId,
      created_at,
      updated_at,
      deleted_at,
      ...invoiceCopy
    } = original;

    // 3. Insert the new invoice
    const { data, error } = await supabase
      .from("invoices")
      .insert({
        ...invoiceCopy,
        code: `${invoiceCopy.code}-COPY-${Date.now()}`,
      })
      .select()
      .single();

    if (error) {
      console.error("Error duplicating invoice:", error);
      throw new Error("Failed to duplicate invoice.");
    }

    revalidatePath("/admin/invoices");
    redirect(`/admin/invoices/${data.id}`);
  });
