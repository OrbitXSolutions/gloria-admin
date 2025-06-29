import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoicesTable } from "@/components/admin/invoices-table"
import { InvoicesTableSkeleton } from "@/components/admin/invoices-table-skeleton"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage your invoices and billing</p>
        </div>
        <Button asChild>
          <Link href="/admin/invoices/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>A list of all invoices in your system</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<InvoicesTableSkeleton />}>
            <InvoicesTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
