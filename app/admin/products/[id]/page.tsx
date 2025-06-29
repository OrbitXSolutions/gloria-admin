import { notFound } from "next/navigation"
import { createSsrClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Trash2, DollarSign, Warehouse, Tag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ProductAttributesDisplay } from "@/components/admin/product-attributes"
import { ProductVariants } from "@/components/admin/product-variants"
import { Database } from "@/lib/types/database.types"
import { getProductImageUrl } from "@/lib/constants/supabase-storage"

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  currency?: Database["public"]["Tables"]["currencies"]["Row"]
  category?: Database["public"]["Tables"]["categories"]["Row"]
}

async function getProduct(id: number): Promise<Product | null> {
  const supabase = await createSsrClient()

  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      currency:currencies(*),
      category:categories(*)
    `)
    .eq("id", id)
    .eq("is_deleted", false)
    .single()

  if (error) {
    console.error("Error fetching product:", error)
    return null
  }

  // Ensure currency and category are undefined instead of null to match Product type
  if (product) {
    return {
      ...product,
      currency: product.currency ?? undefined,
      category: product.category ?? undefined,
    }
  }
  return product
}

async function getProductVariants(variantGroup: string, excludeId: number) {
  const supabase = await createSsrClient()

  const { data: variants, error } = await supabase
    .from("products")
    .select("*")
    .eq("variant_group", variantGroup)
    .neq("id", excludeId)
    .eq("is_deleted", false)

  if (error) {
    console.error("Error fetching variants:", error)
    return []
  }

  return variants || []
}

interface ProductDetailPageProps {
  params: Promise<{ id: number }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  const variants = product.variant_group ? await getProductVariants(product.variant_group, product.id) : []

  const formatPrice = (price: number | null) => {
    if (!price) return "N/A"
    const symbol = product.currency?.symbol_en || "$"
    return `${symbol}${price.toFixed(2)}`
  }

  const getStockStatus = (quantity: number | null) => {
    if (!quantity || quantity === 0) {
      return { label: "Out of Stock", variant: "destructive" as const, color: "text-destructive" }
    } else if (quantity < 10) {
      return { label: "Low Stock", variant: "secondary" as const, color: "text-yellow-600" }
    } else {
      return { label: "In Stock", variant: "default" as const, color: "text-green-600" }
    }
  }

  const stockStatus = getStockStatus(product.quantity)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name_en || "Unnamed Product"}</h1>
            <p className="text-muted-foreground">Product ID: {product.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Product
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Product Images */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Primary Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <Image
                src={getProductImageUrl(product.primary_image) || "/placeholder.svg"}
                alt={product.name_en || "Product"}
                fill
                className="object-cover"
              />
            </div>

            {/* Additional Images */}
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {product.images.slice(0, 6).map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                    <Image
                      src={getProductImageUrl(image) || "/placeholder.svg"}
                      alt={`Product image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Basic product details and specifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Names */}
            <div className="space-y-2">
              <h3 className="font-semibold">Product Names</h3>
              <div className="space-y-1">
                <p>
                  <span className="text-muted-foreground">English:</span> {product.name_en || "Not set"}
                </p>
                <p>
                  <span className="text-muted-foreground">Arabic:</span> {product.name_ar || "Not set"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  SKU
                </h4>
                <code className="block bg-muted px-2 py-1 rounded text-sm">{product.sku || "Not set"}</code>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Category</h4>
                <p className="text-sm">{product.category?.name_en || "Uncategorized"}</p>
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing
              </h4>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-2xl font-bold">{formatPrice(product.price)}</p>
                  {product.old_price && product.old_price > (product.price || 0) && (
                    <p className="text-sm text-muted-foreground line-through">{formatPrice(product.old_price)}</p>
                  )}
                </div>
                {product.old_price && product.old_price > (product.price || 0) && (
                  <Badge variant="destructive">
                    {Math.round(((product.old_price - (product.price || 0)) / product.old_price) * 100)}% OFF
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Stock */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                Stock Status
              </h4>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-2xl font-bold">{product.quantity || 0}</p>
                  <p className="text-sm text-muted-foreground">Units available</p>
                </div>
                <Badge variant={stockStatus.variant} className="text-sm">
                  {stockStatus.label}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Descriptions */}
            <div className="space-y-2">
              <h4 className="font-medium">Descriptions</h4>
              <div className="space-y-3">
                {product.description_en && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">English</p>
                    <p className="text-sm">{product.description_en}</p>
                  </div>
                )}
                {product.description_ar && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Arabic</p>
                    <p className="text-sm" dir="rtl">
                      {product.description_ar}
                    </p>
                  </div>
                )}
                {!product.description_en && !product.description_ar && (
                  <p className="text-sm text-muted-foreground">No descriptions available</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Attributes */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Attributes</CardTitle>
            <CardDescription>Product specifications and features</CardDescription>
          </CardHeader>
          <CardContent>
            <ProductAttributesDisplay attributes={product.attributes} />
          </CardContent>
        </Card>

        {/* SEO & Meta */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>SEO & Metadata</CardTitle>
            <CardDescription>Search engine optimization and metadata information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Meta Titles</h4>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">English:</span> {product.meta_title_en || "Not set"}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Arabic:</span> {product.meta_title_ar || "Not set"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Slugs</h4>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">English:</span> {product.slug || "Not set"}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Arabic:</span> {product.slug_ar || "Not set"}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Meta Descriptions</h4>
              <div className="space-y-3">
                {product.meta_description_en && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">English</p>
                    <p className="text-sm">{product.meta_description_en}</p>
                  </div>
                )}
                {product.meta_description_ar && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Arabic</p>
                    <p className="text-sm" dir="rtl">
                      {product.meta_description_ar}
                    </p>
                  </div>
                )}
                {!product.meta_description_en && !product.meta_description_ar && (
                  <p className="text-sm text-muted-foreground">No meta descriptions set</p>
                )}
              </div>
            </div>

            {product.keywords && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Keywords</h4>
                  <p className="text-sm">{product.keywords}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Variants */}
      {product.variant_group && <ProductVariants product={product} variants={variants} />}

      {/* Admin Notes */}
      {product.admin_note && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Notes</CardTitle>
            <CardDescription>Internal notes for administrative purposes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{product.admin_note}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
