"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, Edit, Trash2, Eye, Link2, CopyIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ProductAttributesCompact } from "./product-attributes"
import { useAction } from "next-safe-action/hooks"
import { duplicateProduct, deleteProduct } from "@/lib/actions/products"
import type { Database, Json, Product } from "@/lib/types/database.types"
import { getProductImageUrl } from "@/lib/constants/supabase-storage"



interface Props {
  products: Product[]
  variantCounts: Record<string, number>
}

export function ProductsTableClient({ products, variantCounts }: Props) {
  const { execute: execDuplicate } = useAction(duplicateProduct);
  const { execute: execDelete } = useAction(deleteProduct);

  const stockStatus = (qty: number | null) =>
    qty && qty > 0
      ? qty < 10
        ? { label: "Low Stock", variant: "secondary" as const }
        : { label: "In Stock", variant: "default" as const }
      : { label: "Out of Stock", variant: "destructive" as const }

  const priceFmt = (price: number | null, cur?: { symbol_en: string | null }) =>
    price !== null && price !== undefined ? `${cur?.symbol_en ?? "$"}${price.toFixed(2)}` : "N/A"

  const renderColor = (attrs: Product["attributes"]) => {
    const color = attrs && typeof attrs === "object" && "color" in attrs ? (attrs as any).color : null
    if (!color || typeof color !== "object") return null
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: color.hex }} />
          </TooltipTrigger>
          <TooltipContent>
            <p>{color.name}</p>
            <p className="text-xs text-muted-foreground">{color.hex}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products ({products.length})</CardTitle>
        <CardDescription>Manage all store products and inventory.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">Image</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Attributes</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const stock = stockStatus(p.quantity)
                const vCount = p.variant_group ? (variantCounts[p.variant_group] ?? 1) : 0
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="relative h-10 w-10 rounded-md overflow-hidden">
                        <Image
                          alt={p.name_en ?? "Product"}
                          fill
                          className="object-cover rounded-md bg-muted"
                          src={
                            getProductImageUrl(p.primary_image) ||
                            "/placeholder.svg"
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{p.name_en ?? "Unnamed"}</p>
                      {p.name_ar && (
                        <p className="text-xs text-muted-foreground">
                          {p.name_ar}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        SKU: {p.sku ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[160px]">
                      <div className="flex items-center gap-1">
                        {renderColor(p.attributes)}
                        <ProductAttributesCompact
                          attributes={p.attributes as any}
                          maxItems={2}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <p>{priceFmt(p.price, p.currency)}</p>
                      {p.old_price && p.old_price > (p.price ?? 0) && (
                        <p className="text-xs line-through text-muted-foreground">
                          {priceFmt(p.old_price, p.currency)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p>{p.quantity ?? 0}</p>
                      <Badge variant={stock.variant} className="text-xs mt-1">
                        {stock.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {p.variant_group ? (
                        <Badge
                          variant="outline"
                          className="text-xs flex items-center gap-1"
                        >
                          <Link2 className="h-3 w-3" /> {vCount}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.quantity && p.quantity > 0 ? "default" : "secondary"
                        }
                      >
                        {p.quantity && p.quantity > 0 ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/products/${p.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/products/${p.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          {p.variant_group && (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/products?variantGroup=${p.variant_group}`}
                              >
                                <Link2 className="mr-2 h-4 w-4" /> Variants
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => execDuplicate({ id: p.id })}
                          >
                            <CopyIcon className="mr-2 h-4 w-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => execDelete({ id: p.id })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
