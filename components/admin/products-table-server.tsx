/**
 * Server component – fetches data with Supabase (cookies() allowed here) and
 * delegates all interactive behaviour to the client component.
 */
import { createSsrClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { ProductsTableClient } from "./products-table-client";
import { ProductsTableSkeleton } from "./products-table-skeleton";

interface ProductsServerProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
    status?: string;
    variantGroup?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

async function getProducts({
  page = 1,
  search = "",
  category = "",
  status = "",
  variantGroup = "",
  sortBy = "created_at",
  sortOrder = "desc",
  pageSize = 10,
}: {
  page?: number;
  search?: string;
  category?: string;
  status?: string;
  variantGroup?: string;
  sortBy?: string;
  sortOrder?: string;
  pageSize?: number;
}) {
  const supabase = await createSsrClient();

  let query = supabase
    .from("products")
    .select(
      `
      *,
      currency:currencies(symbol_en),
      category:categories(name_en, id)
    `,
      { count: "exact" }
    )
    .eq("is_deleted", false);

  // Apply filters
  if (search) {
    query = query.or(
      `name_en.ilike.%${search}%,name_ar.ilike.%${search}%,sku.ilike.%${search}%`
    );
  }

  if (category) {
    query = query.eq("category_id", parseInt(category));
  }

  if (status === "active") {
    query = query.gt("quantity", 0);
  } else if (status === "inactive") {
    query = query.eq("quantity", 0);
  } else if (status === "low-stock") {
    query = query.gt("quantity", 0).lt("quantity", 10);
  }

  if (variantGroup) {
    query = query.eq("variant_group", variantGroup);
  }

  // Apply sorting
  const ascending = sortOrder === "asc";

  // Map sortBy fields to actual database columns
  const sortMapping: Record<string, string> = {
    name: "name_en",
    price: "price",
    quantity: "quantity",
    created_at: "created_at",
    sku: "sku",
  };

  const sortColumn = sortMapping[sortBy] || "created_at";
  query = query.order(sortColumn, { ascending });

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Error fetching products:", error);
    return { products: [], count: 0 };
  }

  return { products: data ?? [], count: count ?? 0 };
}

async function getVariantCounts() {
  const supabase = await createSsrClient();
  const { data } = await supabase
    .from("products")
    .select("variant_group")
    .eq("is_deleted", false)
    .not("variant_group", "is", null);

  const counts: Record<string, number> = {};
  data?.forEach(({ variant_group }) => {
    if (variant_group) counts[variant_group] = (counts[variant_group] || 0) + 1;
  });

  return counts;
}

async function getCategories() {
  const supabase = await createSsrClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name_en")
    .eq("is_deleted", false)
    .order("name_en");

  return data ?? [];
}

export async function ProductsTableServer({
  searchParams,
}: ProductsServerProps) {
  const resolvedSearchParams = await searchParams;

  const page = parseInt(resolvedSearchParams?.page || "1");
  const search = resolvedSearchParams?.search || "";
  const category = resolvedSearchParams?.category || "";
  const status = resolvedSearchParams?.status || "";
  const variantGroup = resolvedSearchParams?.variantGroup || "";
  const sortBy = resolvedSearchParams?.sortBy || "created_at";
  const sortOrder = resolvedSearchParams?.sortOrder || "desc";

  const [{ products, count }, variantCounts, categories] = await Promise.all([
    getProducts({
      page,
      search,
      category,
      status,
      variantGroup,
      sortBy,
      sortOrder,
    }),
    getVariantCounts(),
    getCategories(),
  ]);

  // Map currency and category nulls to undefined for type compatibility
  const mappedProducts = products.map((product: any) => ({
    ...product,
    currency: product.currency === null ? undefined : product.currency,
    category: product.category === null ? undefined : product.category,
  }));

  return (
    <Suspense fallback={<ProductsTableSkeleton />}>
      <ProductsTableClient
        products={mappedProducts}
        variantCounts={variantCounts}
        categories={categories}
        pagination={{
          page,
          pageSize: 10,
          total: count,
        }}
        filters={{
          search,
          category,
          status,
          variantGroup,
        }}
        sorting={{
          sortBy,
          sortOrder,
        }}
      />
    </Suspense>
  );
}
