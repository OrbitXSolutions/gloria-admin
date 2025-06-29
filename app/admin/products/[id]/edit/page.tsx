import { notFound } from "next/navigation"
import { createSsrClient } from "@/lib/supabase/server"
import { ProductForm } from "@/components/admin/product-form"
import { Database } from "@/lib/types/database.types";

type Product = Database["public"]["Tables"]["products"]["Row"]

async function getProduct(id: number): Promise<Product | null> {
  const supabase = await createSsrClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("is_deleted", false)
    .single()

  if (error) {
    console.error("Error fetching product:", error)
    return null
  }

  return product
}

interface EditProductPageProps {
  params: Promise<{ id: number }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  return <ProductForm product={product} mode="edit" />
}
