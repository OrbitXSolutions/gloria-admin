import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Link2, Package } from "lucide-react"
import Image from "next/image"
import { ProductAttributesCompact } from "./product-attributes"
import type { Database } from "@/lib/types/database.types"
import { getProductImageUrl } from "@/lib/constants/supabase-storage"

type Product = Database["public"]["Tables"]["products"]["Row"]

interface ProductVariantsProps {
  product: Product
  variants: Product[]
}

export function ProductVariants({ product, variants }: ProductVariantsProps) {
  if (!variants || variants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Product Variants
          </CardTitle>
          <CardDescription>This product has no variants</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const formatPrice = (price: number | null) => {
    if (!price) return "N/A"
    return `$${price.toFixed(2)}`
  }

  const getStockStatus = (quantity: number | null) => {
    if (!quantity || quantity === 0) {
      return { label: "Out of Stock", variant: "destructive" as const }
    } else if (quantity < 10) {
      return { label: "Low Stock", variant: "secondary" as const }
    } else {
      return { label: "In Stock", variant: "default" as const }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Product Variants ({variants.length + 1})
        </CardTitle>
        <CardDescription>
          Variant Group:{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-sm">
            {product.variant_group}
          </code>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Product */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-16 rounded-md overflow-hidden bg-background">
              <Image
                src={
                  getProductImageUrl(product.primary_image) ||
                  "/placeholder.svg"
                }
                alt={product.name_en || "Product"}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">
                  {product.name_en || "Unnamed Product"}
                </h4>
                <Badge variant="default" className="text-xs">
                  Current
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>SKU: {product.sku || "N/A"}</span>
                <span>Price: {formatPrice(product.price)}</span>
                <Badge
                  variant={getStockStatus(product.quantity).variant}
                  className="text-xs"
                >
                  {getStockStatus(product.quantity).label}
                </Badge>
              </div>
              <ProductAttributesCompact
                attributes={product.attributes as object}
                maxItems={2}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Variant Products */}
        <div className="space-y-3">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 rounded-md overflow-hidden bg-background">
                  <Image
                    src={
                      getProductImageUrl(variant.primary_image) ||
                      "/placeholder.svg"
                    }
                    alt={variant.name_en || "Product"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {variant.name_en || "Unnamed Product"}
                    </h4>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>SKU: {variant.sku || "N/A"}</span>
                    <span>Price: {formatPrice(variant.price)}</span>
                    <Badge
                      variant={getStockStatus(variant.quantity).variant}
                      className="text-xs"
                    >
                      {getStockStatus(variant.quantity).label}
                    </Badge>
                  </div>
                  <ProductAttributesCompact
                    attributes={variant.attributes as object}
                    maxItems={2}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
