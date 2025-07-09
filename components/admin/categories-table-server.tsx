import { Suspense } from "react";

import { getCategories } from "@/lib/actions/categories";
import { CategoriesTableClient } from "./categories-table-client";
import { CategoriesTableSkeleton } from "./categories-table-skeleton";

interface CategoriesServerProps {
  searchParams?: {
    page?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

export async function CategoriesTableServer({
  searchParams,
}: CategoriesServerProps) {
  const page = parseInt(searchParams?.page || "1");
  const search = searchParams?.search || "";
  const sortBy =
    (searchParams?.sortBy as
      | "name_en"
      | "name_ar"
      | "created_at"
      | "updated_at") || "created_at";
  const sortOrder = (searchParams?.sortOrder as "asc" | "desc") || "desc";

  const {
    data: categories,
    count,
    totalPages,
    currentPage,
  } = await getCategories({
    page,
    search,
    sortBy,
    sortOrder,
    limit: 10,
  });

  return (
    <Suspense fallback={<CategoriesTableSkeleton />}>
      <CategoriesTableClient
        categories={categories}
        pagination={{
          page: currentPage,
          pageSize: 10,
          total: count,
          totalPages,
        }}
        filters={{
          search,
        }}
        sorting={{
          sortBy,
          sortOrder,
        }}
      />
    </Suspense>
  );
}
