"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { deleteCategory } from "@/lib/actions/categories";
import type { CategoryWithCounts } from "@/lib/validations/category";
import { getProductImageUrl } from "@/lib/constants/supabase-storage";
import { toast } from "sonner";

interface Props {
  categories: CategoryWithCounts[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search: string;
  };
  sorting: {
    sortBy: string;
    sortOrder: string;
  };
}

interface FilterUpdate {
  search?: string;
  page?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function CategoriesTableClient({
  categories,
  pagination,
  filters,
  sorting,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(filters.search);

  const { execute: execDelete } = useAction(deleteCategory, {
    onSuccess: () => {
      toast.success("Category deleted successfully!");
    },
    onError: ({ error }) => {
      toast.error(
        typeof error.serverError === "string" && error.serverError.trim()
          ? error.serverError
          : "Failed to delete category"
      );
    },
  });

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
    if (
      Object.keys(newFilters).some(
        (key) => key !== "page" && key !== "sortBy" && key !== "sortOrder"
      )
    ) {
      params.set("page", "1");
    }

    router.push(`/admin/categories?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchValue("");
    router.push("/admin/categories");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchValue });
  };

  const handleSort = (column: string) => {
    const newSortOrder =
      sorting.sortBy === column && sorting.sortOrder === "asc" ? "desc" : "asc";
    updateFilters({ sortBy: column, sortOrder: newSortOrder });
  };

  const getSortIcon = (column: string) => {
    if (sorting.sortBy !== column) return <ArrowUpDown className="h-4 w-4" />;
    return sorting.sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const hasActiveFilters = filters.search;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categories ({pagination.total})</CardTitle>
        <CardDescription>
          Manage product categories for your store.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          <div className="flex gap-2">
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
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">Image</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("name_en")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Name
                    {getSortIcon("name_en")}
                  </Button>
                </TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("created_at")}
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                  >
                    Created
                    {getSortIcon("created_at")}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {hasActiveFilters
                        ? "No categories found matching your search."
                        : "No categories found."}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="relative h-10 w-10 rounded-md overflow-hidden">
                        <Image
                          alt={category.name_en ?? "Category"}
                          fill
                          className="object-cover rounded-md bg-muted"
                          src={
                            category.image
                              ? getProductImageUrl(category.image)
                              : "/placeholder.svg"
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {category.name_en ?? "Unnamed"}
                      </p>
                      {category.name_ar && (
                        <p className="text-xs text-muted-foreground">
                          {category.name_ar}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-mono">{category.slug}</p>
                        {category.slug_ar && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {category.slug_ar}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {category._count?.products || 0} products
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {formatDate(category.created_at)}
                      </p>
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
                            <Link href={`/admin/categories/${category.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/categories/${category.id}/edit`}
                            >
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => execDelete({ id: category.id })}
                            disabled={(category._count?.products || 0) > 0}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
              {Math.min(
                pagination.page * pagination.pageSize,
                pagination.total
              )}{" "}
              of {pagination.total} categories
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
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
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
                  }
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateFilters({ page: (pagination.page + 1).toString() })
                }
                disabled={pagination.page >= pagination.totalPages}
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
