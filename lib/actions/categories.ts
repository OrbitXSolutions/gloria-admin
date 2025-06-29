"use server";

import { revalidatePath } from "next/cache";
import { createSsrClient } from "@/lib/supabase/server";
import { categoryFormSchema } from "@/lib/validations/category";
import { createSafeActionClient } from "next-safe-action";
import { redirect } from "next/navigation";
import { z } from "zod";

const action = createSafeActionClient();

export interface CategoriesListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name_en" | "name_ar" | "created_at" | "updated_at";
  sortOrder?: "asc" | "desc";
}

export async function getCategories(params: CategoriesListParams = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = "created_at",
    sortOrder = "desc",
  } = params;

  const supabase = await createSsrClient();

  let query = supabase
    .from("categories")
    .select("*", { count: "exact" })
    .eq("is_deleted", false);

  // Apply search filter
  if (search) {
    query = query.or(`name_en.ilike.%${search}%,name_ar.ilike.%${search}%`);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === "asc" });

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }

  // Get product counts for each category
  const categoriesWithCounts = await Promise.all(
    (data || []).map(async (category) => {
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("category_id", category.id)
        .eq("is_deleted", false);

      return {
        ...category,
        _count: {
          products: productCount || 0,
        },
      };
    })
  );

  return {
    data: categoriesWithCounts,
    count: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    currentPage: page,
  };
}

export async function getCategoryById(id: number) {
  const supabase = await createSsrClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (error) {
    console.error("Error fetching category:", error);
    throw new Error("Failed to fetch category");
  }

  return data;
}

export async function getCategoryBySlug(slug: string) {
  const supabase = await createSsrClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .or(`slug.eq.${slug},slug_ar.eq.${slug}`)
    .eq("is_deleted", false)
    .single();

  if (error) {
    console.error("Error fetching category:", error);
    throw new Error("Failed to fetch category");
  }

  return data;
}

export const createCategory = action
  .inputSchema(categoryFormSchema)
  .action(async ({ parsedInput: formData }) => {
    const supabase = await createSsrClient();

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name_en: formData.name_en,
        name_ar: formData.name_ar,
        slug: formData.slug,
        slug_ar: formData.slug_ar,
        meta_title_en: formData.meta_title_en || null,
        meta_title_ar: formData.meta_title_ar || null,
        meta_description_en: formData.meta_description_en || null,
        meta_description_ar: formData.meta_description_ar || null,
        image: formData.image || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating category:", error);
      throw new Error("Failed to create category");
    }

    revalidatePath("/admin/categories");
    redirect(`/admin/categories/${data.id}`);
  });

export const updateCategory = action
  .inputSchema(categoryFormSchema.extend({ id: z.number() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSsrClient();
    const { id, ...formData } = parsedInput;

    const { data, error } = await supabase
      .from("categories")
      .update({
        name_en: formData.name_en,
        name_ar: formData.name_ar,
        slug: formData.slug,
        slug_ar: formData.slug_ar,
        meta_title_en: formData.meta_title_en || null,
        meta_title_ar: formData.meta_title_ar || null,
        meta_description_en: formData.meta_description_en || null,
        meta_description_ar: formData.meta_description_ar || null,
        image: formData.image || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("is_deleted", false)
      .select()
      .single();

    if (error) {
      console.error("Error updating category:", error);
      throw new Error("Failed to update category");
    }

    revalidatePath("/admin/categories");
    revalidatePath(`/admin/categories/${id}`);
    return { success: true, data };
  });

export const deleteCategory = action
  .inputSchema(z.object({ id: z.number() }))
  .action(async ({ parsedInput }) => {
    const supabase = await createSsrClient();

    // Check if category has products
    const { count: productCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("category_id", parsedInput.id)
      .eq("is_deleted", false);

    if (productCount && productCount > 0) {
      throw new Error("Cannot delete category with existing products");
    }

    const { error } = await supabase
      .from("categories")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", parsedInput.id);

    if (error) {
      console.error("Error deleting category:", error);
      throw new Error("Failed to delete category");
    }

    revalidatePath("/admin/categories");
    return { success: true };
  });

export const checkSlugExists = action
  .inputSchema(
    z.object({
      slug: z.string(),
      excludeId: z.number().optional(),
    })
  )
  .action(async ({ parsedInput: { slug, excludeId } }) => {
    const supabase = await createSsrClient();

    let query = supabase
      .from("categories")
      .select("id")
      .or(`slug.eq.${slug},slug_ar.eq.${slug}`)
      .eq("is_deleted", false);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error checking slug:", error);
      throw new Error("Failed to check slug existence");
    }

    return { exists: data && data.length > 0 };
  });
