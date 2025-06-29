/**
 * Server component – fetches data with Supabase (cookies() allowed here) and
 * delegates all interactive behaviour to the client component.
 */
import { createSsrClient } from "@/lib/supabase/server"
import { Suspense } from "react"
import { ProductsTableClient } from "./products-table-client"
import { ProductsTableSkeleton } from "./products-table-skeleton"

async function getProducts() {
  const supabase = await createSsrClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      currency:currencies(symbol_en),
      category:categories(name_en)
    `,
    )
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching products:", error)
    return []
  }

  return data ?? []
}

async function getVariantCounts() {
  const supabase = await createSsrClient();
  const { data } = await supabase
    .from("products")
    .select("variant_group")
    .eq("is_deleted", false)
    .not("variant_group", "is", null)

  const counts: Record<string, number> = {}
  data?.forEach(({ variant_group }) => {
    if (variant_group) counts[variant_group] = (counts[variant_group] || 0) + 1
  })

  return counts
}

export async function ProductsTableServer() {
  const [products, variantCounts] = await Promise.all([getProducts(), getVariantCounts()])

  // Map currency and category nulls to undefined for type compatibility
  const mappedProducts = products.map((product: any) => ({
    ...product,
    currency: product.currency === null ? undefined : product.currency,
    category: product.category === null ? undefined : product.category,
  }));

  return (
    <Suspense fallback={<ProductsTableSkeleton />}>
      <ProductsTableClient products={mappedProducts} variantCounts={variantCounts} />
    </Suspense>
  )
}
