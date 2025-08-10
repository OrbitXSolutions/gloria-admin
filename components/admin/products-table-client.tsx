"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Link2,
  CopyIcon,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ProductAttributesCompact } from "./product-attributes";
import { useAction } from "next-safe-action/hooks";
import { duplicateProduct, deleteProduct } from "@/lib/actions/products";
import type { Database, Json, Product } from "@/lib/types/database.types";
import { getProductImageUrl } from "@/lib/constants/supabase-storage";

interface Category {
  id: number;
  name_en: string | null;
}

interface Props {
  products: Product[];
  variantCounts: Record<string, number>;
  categories: Category[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  filters: {
    search: string;
    category: string;
    status: string;
    variantGroup: string;
  };
  sorting: {
    sortBy: string;
    sortOrder: string;
  };
}

interface FilterUpdate {
  search?: string;
  category?: string;
  status?: string;
  variantGroup?: string;
  page?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function ProductsTableClient({
  products,
  variantCounts,
  categories,
  pagination,
  filters,
  sorting,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(filters.search);
  const isMobile = useIsMobile();

  const { execute: execDuplicate } = useAction(duplicateProduct);
  const { execute: execDelete } = useAction(deleteProduct);

  const updateFilters = (newFilters: FilterUpdate) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change (except when explicitly setting page)
    if (Object.keys(newFilters).some((key) => key !== "page")) {
      params.set("page", "1");
    }

    router.push(`/admin/products?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchValue("");
    router.push("/admin/products");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchValue });
  };

  const handleSort = (column: string) => {
    const isCurrentColumn = sorting.sortBy === column;
    const newSortOrder =
      isCurrentColumn && sorting.sortOrder === "asc" ? "desc" : "asc";

    updateFilters({
      sortBy: column,
      sortOrder: newSortOrder,
    });
  };

  const getSortIcon = (column: string) => {
    if (sorting.sortBy !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    }

    return sorting.sortOrder === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const SortableHeader = ({
    column,
    children,
    className = "",
  }: {
    column: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead className={className}>
      <Button
        variant="ghost"
        onClick={() => handleSort(column)}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        {children}
        {getSortIcon(column)}
      </Button>
    </TableHead>
  );

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.status ||
    filters.variantGroup ||
    sorting.sortBy !== "created_at" ||
    sorting.sortOrder !== "desc";

  const stockStatus = (qty: number | null) =>
    qty && qty > 0
      ? qty < 10
        ? { label: "Low Stock", variant: "secondary" as const }
        : { label: "In Stock", variant: "default" as const }
      : { label: "Out of Stock", variant: "destructive" as const };

  const priceFmt = (price: number | null, cur?: { symbol_en: string | null, symbol_ar?: string | null, code?: string | null }) =>
    price !== null && price !== undefined
      ? `${(cur?.symbol_en || cur?.code || 'AED')}${price.toFixed(2)}`
      : "N/A";

  const renderColor = (attrs: Product["attributes"]) => {
    const color =
      attrs && typeof attrs === "object" && "color" in attrs
        ? (attrs as any).color
        : null;
    if (!color || typeof color !== "object") return null;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="h-4 w-4 rounded-full border border-border"
              style={{ backgroundColor: color.hex }}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{color.name}</p>
            <p className="text-xs text-muted-foreground">{color.hex}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products ({pagination.total})</CardTitle>
        <CardDescription>
          Manage all store products and inventory.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, SKU..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          <div className="flex gap-2">
            <Select
              value={filters.category}
              onValueChange={(value) =>
                updateFilters({ category: value === "all" ? "" : value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name_en || "Unnamed Category"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) =>
                updateFilters({ status: value === "all" ? "" : value })
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} size="icon">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                Search: {filters.search}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => updateFilters({ search: "" })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.category && (
              <Badge variant="secondary" className="gap-1">
                Category:{" "}
                {categories.find((c) => c.id.toString() === filters.category)
                  ?.name_en || filters.category}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => updateFilters({ category: "" })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary" className="gap-1">
                Status: {filters.status}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => updateFilters({ status: "" })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.variantGroup && (
              <Badge variant="secondary" className="gap-1">
                Variant Group: {filters.variantGroup}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => updateFilters({ variantGroup: "" })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {(sorting.sortBy !== "created_at" ||
              sorting.sortOrder !== "desc") && (
                <Badge variant="secondary" className="gap-1">
                  Sort:{" "}
                  {sorting.sortBy === "name"
                    ? "Name"
                    : sorting.sortBy === "price"
                      ? "Price"
                      : sorting.sortBy === "quantity"
                        ? "Stock"
                        : sorting.sortBy === "sku"
                          ? "SKU"
                          : sorting.sortBy === "created_at"
                            ? "Date Created"
                            : sorting.sortBy}{" "}
                  ({sorting.sortOrder === "asc" ? "↑" : "↓"})
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      updateFilters({ sortBy: "created_at", sortOrder: "desc" })
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
          </div>
        )}

        {isMobile ? (
          // Mobile Card Layout
          <div className="space-y-4">
            {products.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    {hasActiveFilters
                      ? "No products found matching your filters."
                      : "No products found."}
                  </div>
                </CardContent>
              </Card>
            ) : (
              products.map((p) => {
                const stock = stockStatus(p.quantity);
                const vCount = p.variant_group
                  ? variantCounts[p.variant_group] ?? 1
                  : 0;
                return (
                  <Card key={p.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-medium truncate">
                                {p.name_en || "Untitled"}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                SKU: {p.sku || "N/A"}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={stock.variant}>
                                  {stock.label}
                                </Badge>
                                {vCount > 1 && (
                                  <Badge variant="outline">
                                    {vCount} variants
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-medium">
                                {priceFmt(p.price, p.currency)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Stock: {p.quantity ?? 0}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0 mt-1"
                                  >
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/products/${p.id}`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/admin/products/${p.id}/edit`}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      execDuplicate({
                                        id: p.id,
                                      })
                                    }
                                  >
                                    <CopyIcon className="mr-2 h-4 w-4" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      navigator.clipboard.writeText(
                                        `${window.location.origin}/admin/products/${p.id}`
                                      )
                                    }
                                  >
                                    <Link2 className="mr-2 h-4 w-4" />
                                    Copy link
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                      execDelete({
                                        id: p.id,
                                      })
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          {p.attributes &&
                            Object.keys(p.attributes).length > 0 && (
                              <div className="mt-3">
                                <ProductAttributesCompact
                                  attributes={p.attributes as any}
                                />
                              </div>
                            )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          // Desktop Table Layout with horizontal scroll on small widths
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[90px]">Image</TableHead>
                  <SortableHeader column="name">Details</SortableHeader>
                  <TableHead>Attributes</TableHead>
                  <SortableHeader column="price">Price</SortableHeader>
                  <SortableHeader column="quantity">Stock</SortableHeader>
                  <TableHead>Variants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        {hasActiveFilters
                          ? "No products found matching your filters."
                          : "No products found."}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => {
                    const stock = stockStatus(p.quantity);
                    const vCount = p.variant_group
                      ? variantCounts[p.variant_group] ?? 1
                      : 0;
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
                          <p className="font-medium">
                            {p.name_en ?? "Unnamed"}
                          </p>
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
                          <Badge
                            variant={stock.variant}
                            className="text-xs mt-1"
                          >
                            {stock.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {p.variant_group ? (
                            <Badge
                              variant="outline"
                              className="text-xs flex items-center gap-1 cursor-pointer"
                              onClick={() =>
                                updateFilters({
                                  variantGroup: p.variant_group || "",
                                })
                              }
                            >
                              <Link2 className="h-3 w-3" /> {vCount}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.quantity && p.quantity > 0
                                ? "default"
                                : "secondary"
                            }
                          >
                            {p.quantity && p.quantity > 0
                              ? "Active"
                              : "Inactive"}
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
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateFilters({
                                      variantGroup: p.variant_group || "",
                                    })
                                  }
                                >
                                  <Link2 className="mr-2 h-4 w-4" /> View
                                  Variants
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
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
              {Math.min(
                pagination.page * pagination.pageSize,
                pagination.total
              )}{" "}
              of {pagination.total} products
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateFilters({ page: (pagination.page - 1).toString() })
                }
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={
                        pagination.page === pageNum ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        updateFilters({ page: pageNum.toString() })
                      }
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateFilters({ page: (pagination.page + 1).toString() })
                }
                disabled={pagination.page >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
