"use server";

import { createSsrClient } from "@/lib/supabase/server";
import { ProductFormSchema } from "@/lib/validations/product";
import { generateProductSeo } from "@/lib/seo/generate-product-seo";
import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const action = createSafeActionClient();

export const createProduct = action
  .inputSchema(ProductFormSchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createSsrClient();

    // Fetch related data (category) needed for SEO generation
    let categoryName: string | null = null;
    if (parsedInput.category_id) {
      const { data: cat } = await supabase
        .from("categories")
        .select("name_en")
        .eq("id", parsedInput.category_id)
        .single();
      categoryName = (cat as any)?.name_en || null;
    }

    // Always regenerate SEO block using centralized generator (override any supplied values)
    const nameEn = parsedInput.name_en?.trim();
    const nameAr = (parsedInput.name_ar || '').trim();
    const descEn = (parsedInput.description_en || '').trim();
    const descAr = (parsedInput.description_ar || '').trim();
    const seo = generateProductSeo({
      name_en: nameEn,
      name_ar: nameAr,
      description_en: descEn,
      description_ar: descAr,
      category_en: categoryName || undefined,
      category_ar: undefined,
      brand: (parsedInput as any).brand || undefined,
      primary_image: parsedInput.primary_image || undefined,
    });
    parsedInput.meta_title_en = seo.meta_title_en;
    parsedInput.meta_title_ar = seo.meta_title_ar;
    parsedInput.meta_description_en = seo.meta_description_en;
    parsedInput.meta_description_ar = seo.meta_description_ar;
    parsedInput.keywords = seo.keywords.en; // store EN keywords array; AR kept inside thumbnail JSON for now
    parsedInput.meta_thumbnail = JSON.stringify(seo.meta_thumbnail);

    // Convert keywords array to comma-separated string
    const keywordsString = parsedInput.keywords?.join(", ") || null;

    const { data, error } = await supabase
      .from("products")
      .insert({
        ...parsedInput,
        keywords: keywordsString,
        is_deleted: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }

    revalidatePath("/admin/products");
    redirect(`/admin/products/${data.id}`);
  });

export const updateProduct = action
  .inputSchema(
    ProductFormSchema.extend({ id: z.number(), regenerate_seo: z.boolean().optional() })
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createSsrClient();
    const { id, regenerate_seo, ...updateData } = parsedInput as typeof parsedInput & { regenerate_seo?: boolean };

    // If regenerate_seo flag set, fetch category and regenerate SEO
    if (regenerate_seo) {
      let categoryName: string | null = null;
      if (updateData.category_id) {
        const { data: cat } = await supabase
          .from("categories")
          .select("name_en")
          .eq("id", updateData.category_id)
          .single();
        categoryName = (cat as any)?.name_en || null;
      }
      const seo = generateProductSeo({
        name_en: updateData.name_en?.trim(),
        name_ar: (updateData.name_ar || '')?.trim(),
        description_en: (updateData.description_en || '')?.trim(),
        description_ar: (updateData.description_ar || '')?.trim(),
        category_en: categoryName || undefined,
        category_ar: undefined,
        brand: (updateData as any).brand || undefined,
        primary_image: updateData.primary_image || undefined,
      });
      updateData.meta_title_en = seo.meta_title_en;
      updateData.meta_title_ar = seo.meta_title_ar;
      updateData.meta_description_en = seo.meta_description_en;
      updateData.meta_description_ar = seo.meta_description_ar;
      updateData.keywords = seo.keywords.en;
      updateData.meta_thumbnail = JSON.stringify(seo.meta_thumbnail);
    }

    // Convert keywords array to comma-separated string
    const keywordsString = updateData.keywords?.join(", ") || null;

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
      .single();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);

    return { success: true, data };
  });

export const deleteProduct = action
  .inputSchema(z.object({ id: z.number() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSsrClient();

    const { error } = await supabase
      .from("products")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", parsedInput.id);

    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }

    revalidatePath("/admin/products");
    redirect("/admin/products");
  });

export const duplicateProduct = action
  .inputSchema(z.object({ id: z.number() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSsrClient();

    // Get the original product
    const { data: originalProduct, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .eq("id", parsedInput.id)
      .eq("is_deleted", false)
      .single();

    if (fetchError || !originalProduct) {
      throw new Error("Product not found");
    }

    // Create duplicate with modified name and SKU
    const { id, created_at, updated_at, deleted_at, ...productData } =
      originalProduct;

    const { data, error } = await supabase
      .from("products")
      .insert({
        ...productData,
        name_en: `${productData.name_en} (Copy)`,
        name_ar: productData.name_ar ? `${productData.name_ar} (نسخة)` : null,
        sku: `${productData.sku}-COPY-${Date.now()}`,
        slug: `${productData.slug}-copy-${Date.now()}`,
        slug_ar: productData.slug_ar
          ? `${productData.slug_ar}-نسخة-${Date.now()}`
          : null,
        is_deleted: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to duplicate product: ${error.message}`);
    }

    revalidatePath("/admin/products");
    redirect(`/admin/products/${data.id}`);
  });
