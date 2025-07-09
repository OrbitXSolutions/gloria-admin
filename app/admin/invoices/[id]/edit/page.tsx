import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/admin/invoice-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getInvoiceById } from "@/lib/actions/invoices";

interface EditInvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({
  params,
}: EditInvoicePageProps) {
  const { id } = await params;
  const idNumber = Number(id);
  const result = await getInvoiceById(idNumber);

  if (!result) {
    notFound();
  }

  const invoice = result;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/invoices/${invoice.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoice
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
          <p className="text-muted-foreground">Update invoice {invoice.code}</p>
        </div>
      </div>
    </div>
  );
}
