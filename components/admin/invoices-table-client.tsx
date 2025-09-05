"use client";

import type React from "react";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Edit, MoreHorizontal, Trash2, Copy, Search } from "lucide-react";
import Link from "next/link";
import { deleteInvoice, duplicateInvoice } from "@/lib/actions/invoices";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Database } from "@/lib/types/database.types";
import { formatPrice } from "@/lib/utils/format-price";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"] & {
  user_name: string;
  user_email: string;
  order?: {
    order_items?: Array<{
      product?: {
        currency_code: string | null;
      } | null;
    }>;
  };
};

interface InvoicesTableClientProps {
  invoices: Invoice[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function InvoicesTableClient({
  invoices,
  total,
  totalPages,
  currentPage,
}: InvoicesTableClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { execute: executeDelete, isExecuting: isDeleting } = useAction(
    deleteInvoice,
    {
      onSuccess: () => {
        toast.success("Invoice deleted successfully");
        setDeleteId(null);
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Failed to delete invoice");
      },
    }
  );

  const { execute: executeDuplicate, isExecuting: isDuplicating } = useAction(
    duplicateInvoice,
    {
      onSuccess: () => {
        toast.success("Invoice duplicated successfully");
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Failed to duplicate invoice");
      },
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.delete("page");
    router.push(`/admin/invoices?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/admin/invoices?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice Code</TableHead>
              <TableHead>Order Code</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.code}</TableCell>
                  <TableCell>
                    {invoice.order_code ? (
                      <Badge variant="outline">{invoice.order_code}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{invoice.user_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.user_email}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(
                      invoice.total_price,
                      { code: invoice.order?.order_items?.[0]?.product?.currency_code || 'AED', symbol_en: 'AED' },
                      'en'
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.created_at ? (
                      new Date(invoice.created_at).toLocaleDateString()
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/invoices/${invoice.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/invoices/${invoice.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => executeDuplicate({ id: invoice.id })}
                          disabled={isDuplicating}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(invoice.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {invoices.length} of {total} invoices
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && executeDelete({ id: deleteId })}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
