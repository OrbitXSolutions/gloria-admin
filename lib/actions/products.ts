"use server"

import { createSsrClient } from "@/lib/supabase/server"
import { ProductFormSchema } from "@/lib/validations/product"
import { createSafeActionClient } from "next-safe-action"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const action = createSafeActionClient()

export const createProduct = action.schema(ProductFormSchema).action(async ({ parsedInput }) => {
  const supabase = await createSsrClient();

  // Convert keywords array to comma-separated string
  const keywordsString = parsedInput.keywords?.join(", ") || null

  const { data, error } = await supabase
    .from("products")
    .insert({
      ...parsedInput,
      keywords: keywordsString,
      is_deleted: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`)
  }

  revalidatePath("/admin/products")
  redirect(`/admin/products/${data.id}`)
})

export const updateProduct = action
  .schema(ProductFormSchema.extend({ id: z.number() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSsrClient()
    const { id, ...updateData } = parsedInput

    // Convert keywords array to comma-separated string
    const keywordsString = updateData.keywords?.join(", ") || null

    const { data, error } = await supabase
      .from("products")
      .update({
        ...updateData,
        keywords: keywordsString,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("is_deleted", false)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`)
    }

    revalidatePath("/admin/products")
    revalidatePath(`/admin/products/${id}`)

    return { success: true, data }
  })

export const deleteProduct = action.schema(z.object({ id: z.number() })).action(async ({ parsedInput }) => {
  const supabase = await createSsrClient()

  const { error } = await supabase
    .from("products")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", parsedInput.id)

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`)
  }

  revalidatePath("/admin/products")
  redirect("/admin/products")
})

export const duplicateProduct = action.schema(z.object({ id: z.number() })).action(async ({ parsedInput }) => {
  const supabase = await createSsrClient()

  // Get the original product
  const { data: originalProduct, error: fetchError } = await supabase
    .from("products")
    .select("*")
    .eq("id", parsedInput.id)
    .eq("is_deleted", false)
    .single()

  if (fetchError || !originalProduct) {
    throw new Error("Product not found")
  }

  // Create duplicate with modified name and SKU
  const { id, created_at, updated_at, deleted_at, ...productData } = originalProduct

  const { data, error } = await supabase
    .from("products")
    .insert({
      ...productData,
      name_en: `${productData.name_en} (Copy)`,
      name_ar: productData.name_ar ? `${productData.name_ar} (نسخة)` : null,
      sku: `${productData.sku}-COPY-${Date.now()}`,
      slug: `${productData.slug}-copy-${Date.now()}`,
      slug_ar: productData.slug_ar ? `${productData.slug_ar}-نسخة-${Date.now()}` : null,
      is_deleted: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to duplicate product: ${error.message}`)
  }

  revalidatePath("/admin/products")
  redirect(`/admin/products/${data.id}`)
})
