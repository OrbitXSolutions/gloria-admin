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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Edit,
  Eye,
  Package,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
} from "lucide-react";
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
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import type { Database } from "@/lib/types/database.types";
import { updateOrderStatus } from "@/lib/actions/orders";
import { formatPrice } from "@/lib/utils/format-price";

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  order_items?: Array<{
    quantity: number | null;
    price: number | null;
    product: {
      name_en: string | null;
      currency_code: string | null;
    } | null;
  }>;
};

interface FilterUpdate {
  search?: string;
  status?: string;
  paymentMethod?: string;
  page?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface Props {
  orders: Order[];
  statusCounts: Record<string, number>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  filters: {
    search: string;
    status: string;
    paymentMethod: string;
  };
  sorting: {
    sortBy: string;
    sortOrder: string;
  };
}

export function OrdersTableClient({
  orders,
  statusCounts,
  pagination,
  filters,
  sorting,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(filters.search);
  const isMobile = useIsMobile();

  // Status update dialog state
  const [statusUpdateDialog, setStatusUpdateDialog] = useState<{
    isOpen: boolean;
    order: Order | null;
    newStatus: string;
    adminNote: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    order: null,
    newStatus: "",
    adminNote: "",
    isLoading: false,
  });

  // Available order statuses
  const orderStatuses = [
    { value: "draft", label: "Draft" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "failed", label: "Failed" },
    { value: "refunded", label: "Refunded" },
    { value: "returned", label: "Returned" },
  ];

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!statusUpdateDialog.order) return;

    setStatusUpdateDialog(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await updateOrderStatus({
        orderId: statusUpdateDialog.order.id,
        newStatus: statusUpdateDialog.newStatus as any,
        adminNote: statusUpdateDialog.adminNote || undefined,
        changedBy: "admin", // You might want to get this from auth context
      });

      // The action returns the data directly, not wrapped in a success property
      if (result) {
        toast.success(`Order status updated to ${statusUpdateDialog.newStatus}`);
        setStatusUpdateDialog({
          isOpen: false,
          order: null,
          newStatus: "",
          adminNote: "",
          isLoading: false,
        });
        // Refresh the page to show updated data
        router.refresh();
      } else {
        toast.error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setStatusUpdateDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Open status update dialog
  const openStatusUpdateDialog = (order: Order) => {
    setStatusUpdateDialog({
      isOpen: true,
      order,
      newStatus: order.status || "pending",
      adminNote: "",
      isLoading: false,
    });
  };

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

    router.push(`/admin/orders?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchValue("");
    router.push("/admin/orders");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchValue });
  };

  const handleSort = (column: string) => {
    const isCurrentColumn = sorting.sortBy === column;
    const newOrder =
      isCurrentColumn && sorting.sortOrder === "asc" ? "desc" : "asc";

    updateFilters({
      sortBy: column,
      sortOrder: newOrder,
    });
  };

  const SortableHeader = ({
    column,
    children,
  }: {
    column: string;
    children: React.ReactNode;
  }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(column)}
        className="h-auto p-0 font-semibold hover:bg-transparent hover:text-foreground/80"
      >
        {children}
        {sorting.sortBy === column ? (
          sorting.sortOrder === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : (
            <ArrowDown className="ml-2 h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        )}
      </Button>
    </TableHead>
  );

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.paymentMethod ||
    sorting.sortBy !== "created_at" ||
    sorting.sortOrder !== "desc";

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "processing":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "shipped":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "cancelled":
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "refunded":
      case "returned":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPaymentMethodColor = (method: string | null) => {
    switch (method) {
      case "cash":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "card":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const priceFmt = (price: number | null, order?: Order) => {
    if (price === null || price === undefined) return 'AED0.00'
    return formatPrice(
      price,
      {
        code: order?.order_items?.[0]?.product?.currency_code ?? 'AED',
        symbol_en: 'AED'
      },
      'en'
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders ({pagination.total})</CardTitle>
        <CardDescription>
          A list of all orders including customer details, status, and total
          amount.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search orders..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          <div className="flex gap-2">
            <Select
              value={filters.status}
              onValueChange={(value) =>
                updateFilters({ status: value === "all" ? "" : value })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">
                  Pending ({statusCounts.pending || 0})
                </SelectItem>
                <SelectItem value="confirmed">
                  Confirmed ({statusCounts.confirmed || 0})
                </SelectItem>
                <SelectItem value="processing">
                  Processing ({statusCounts.processing || 0})
                </SelectItem>
                <SelectItem value="shipped">
                  Shipped ({statusCounts.shipped || 0})
                </SelectItem>
                <SelectItem value="delivered">
                  Delivered ({statusCounts.delivered || 0})
                </SelectItem>
                <SelectItem value="cancelled">
                  Cancelled ({statusCounts.cancelled || 0})
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.paymentMethod}
              onValueChange={(value) =>
                updateFilters({ paymentMethod: value === "all" ? "" : value })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear
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
            {filters.paymentMethod && (
              <Badge variant="secondary" className="gap-1">
                Payment: {filters.paymentMethod}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => updateFilters({ paymentMethod: "" })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {(sorting.sortBy !== "created_at" ||
              sorting.sortOrder !== "desc") && (
                <Badge variant="secondary" className="gap-1">
                  Sort:{" "}
                  {sorting.sortBy === "code"
                    ? "Code"
                    : sorting.sortBy === "customer"
                      ? "Customer"
                      : sorting.sortBy === "total"
                        ? "Total"
                        : sorting.sortBy === "status"
                          ? "Status"
                          : sorting.sortBy === "payment"
                            ? "Payment"
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
        )}{" "}
        {isMobile ? (
          // Mobile Card Layout
          <div className="space-y-4">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    {hasActiveFilters
                      ? "No orders found matching your filters."
                      : "No orders found."}
                  </div>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => {
                const customerName = order.user
                  ? `${order.user.first_name || ""} ${order.user.last_name || ""
                    }`.trim() ||
                  order.user.email ||
                  "Unknown Customer"
                  : "Unknown Customer";
                const itemsCount = order.order_items?.length ?? 0;
                const firstItem = order.order_items?.[0];

                return (
                  <Card key={order.id} className="cursor-pointer" onClick={() => router.push(`/admin/orders/${order.code || order.id}`)}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-sm">
                              Order #{order.id.toString().slice(-8)}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {customerName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.created_at &&
                                formatDistanceToNow(
                                  new Date(order.created_at),
                                  { addSuffix: true }
                                )}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-medium">
                              {priceFmt(order.total_price, order)}
                            </div>
                            {order.shipping && order.shipping > 0 && (
                              <p className="text-xs text-muted-foreground">
                                incl. shipping
                              </p>
                            )}
                            <div className="flex gap-1 mt-1">
                              <Badge className={getStatusColor(order.status)}>
                                {order.status || "pending"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={getPaymentMethodColor(
                                order.payment_method
                              )}
                            >
                              {order.payment_method || "cash"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {itemsCount} item{itemsCount !== 1 ? "s" : ""}
                              {firstItem && ` • ${firstItem.product?.name_en}`}
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-11 w-11 p-0 relative z-10"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                }}
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()} className="z-20">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/orders/${order.code || order.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/orders/${order.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Order
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openStatusUpdateDialog(order) }}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Update Status
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                <Package className="mr-2 h-4 w-4" />
                                Print Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                  <SortableHeader column="code">Order</SortableHeader>
                  <SortableHeader column="customer">Customer</SortableHeader>
                  <TableHead>Items</TableHead>
                  <SortableHeader column="total">Total</SortableHeader>
                  <SortableHeader column="payment">Payment</SortableHeader>
                  <SortableHeader column="status">Status</SortableHeader>
                  <SortableHeader column="created_at">Date</SortableHeader>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {hasActiveFilters
                        ? "No orders found with the current filters."
                        : "No orders found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/orders/${order.code || order.id}`)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">
                            #{order.code || order.id}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ID: {order.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {order.user?.first_name} {order.user?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.user?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {order.order_items?.length || 0} items
                          </p>
                          {order.order_items &&
                            order.order_items.length > 0 && (
                              <p className="text-sm text-muted-foreground">
                                {order.order_items[0].product?.name_en}
                                {order.order_items.length > 1 &&
                                  ` +${order.order_items.length - 1} more`}
                              </p>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {priceFmt(order.total_price, order)}
                          </p>
                          {order.shipping && order.shipping > 0 && (
                            <p className="text-xs text-muted-foreground">
                              incl. shipping
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getPaymentMethodColor(
                            order.payment_method
                          )}
                        >
                          {order.payment_method || "cash"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">
                            {order.created_at &&
                              new Date(order.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.created_at &&
                              formatDistanceToNow(new Date(order.created_at), {
                                addSuffix: true,
                              })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                          >
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/orders/${order.code || order.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openStatusUpdateDialog(order)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Update status
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Package className="mr-2 h-4 w-4" />
                              Track shipment
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Cancel order
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
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
              {Math.min(
                pagination.page * pagination.pageSize,
                pagination.total
              )}{" "}
              of {pagination.total} orders
            </p>
            <Pagination>
              <PaginationContent>
                {pagination.page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        updateFilters({
                          page: (pagination.page - 1).toString(),
                        });
                      }}
                    />
                  </PaginationItem>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((pageNum) => {
                    if (totalPages <= 7) return true;
                    if (pageNum <= 2 || pageNum >= totalPages - 1) return true;
                    if (Math.abs(pageNum - pagination.page) <= 1) return true;
                    return false;
                  })
                  .map((pageNum, index, array) => {
                    if (index > 0 && pageNum - array[index - 1] > 1) {
                      return [
                        <PaginationItem key={`ellipsis-${pageNum}`}>
                          <PaginationEllipsis />
                        </PaginationItem>,
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              updateFilters({ page: pageNum.toString() });
                            }}
                            isActive={pageNum === pagination.page}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>,
                      ];
                    }
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            updateFilters({ page: pageNum.toString() });
                          }}
                          isActive={pageNum === pagination.page}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                {pagination.page < totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        updateFilters({
                          page: (pagination.page + 1).toString(),
                        });
                      }}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>

      {/* Status Update Dialog */}
      <Dialog
        open={statusUpdateDialog.isOpen}
        onOpenChange={(open) => setStatusUpdateDialog(prev => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status for order #{statusUpdateDialog.order?.code || statusUpdateDialog.order?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={statusUpdateDialog.newStatus}
                onValueChange={(value) =>
                  setStatusUpdateDialog(prev => ({ ...prev, newStatus: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {orderStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="note" className="text-right">
                Note
              </Label>
              <Textarea
                id="note"
                placeholder="Optional admin note..."
                className="col-span-3"
                value={statusUpdateDialog.adminNote}
                onChange={(e) =>
                  setStatusUpdateDialog(prev => ({ ...prev, adminNote: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setStatusUpdateDialog({
                  isOpen: false,
                  order: null,
                  newStatus: "",
                  adminNote: "",
                  isLoading: false,
                })
              }
              disabled={statusUpdateDialog.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleStatusUpdate}
              disabled={statusUpdateDialog.isLoading || !statusUpdateDialog.newStatus}
            >
              {statusUpdateDialog.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
