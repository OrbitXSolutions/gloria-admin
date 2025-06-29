import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CategoriesTableServer } from "@/components/admin/categories-table-server";
import { CategoriesTableSkeleton } from "@/components/admin/categories-table-skeleton";

interface SearchParams {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface CategoriesPageProps {
  searchParams: SearchParams;
}

export default function CategoriesPage({ searchParams }: CategoriesPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage your product categories and their settings.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Link>
        </Button>
      </div>

      <Suspense fallback={<CategoriesTableSkeleton />}>
        <CategoriesTableServer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
