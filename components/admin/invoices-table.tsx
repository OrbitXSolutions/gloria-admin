import { InvoicesTableClient } from "./invoices-table-client";
import { getInvoices } from "@/lib/actions/invoices";

interface InvoicesTableProps {
  searchParams?: {
    page?: string;
    search?: string;
  };
}

export async function InvoicesTable({ searchParams }: InvoicesTableProps) {
  const page = Number(searchParams?.page) || 1;
  const search = searchParams?.search || "";

  const result = await getInvoices({ page, limit: 10, search });

  if (!result) {
    return <div>Failed to load invoices</div>;
  }

  const { invoices, total, totalPages } = result;

  // Ensure all required fields are non-null for Invoice type
  const sanitizedInvoices = invoices.map((invoice) => ({
    ...invoice,
    user_name: invoice.user_name ?? "",
    user_email: invoice.user_email ?? "",
    // Add similar lines for any other required non-nullable fields in Invoice
  }));

  return (
    <InvoicesTableClient
      invoices={sanitizedInvoices}
      total={total}
      totalPages={totalPages}
      currentPage={page}
    />
  );
}
