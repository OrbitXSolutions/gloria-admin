import { notFound } from "next/navigation";
import { getCategoryById } from "@/lib/actions/categories";
import { CategoryForm } from "@/components/admin/category-form";

interface EditCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const categoryId = parseInt((await params).id);

  if (isNaN(categoryId)) {
    notFound();
  }

  try {
    const category = await getCategoryById(categoryId);

    if (!category) {
      notFound();
    }

    return (
      <CategoryForm
        initialData={{
          id: category.id,
          name_en: category.name_en || "",
          name_ar: category.name_ar || "",
          slug: category.slug,
          slug_ar: category.slug_ar,
          meta_title_en: category.meta_title_en || "",
          meta_title_ar: category.meta_title_ar || "",
          meta_description_en: category.meta_description_en || "",
          meta_description_ar: category.meta_description_ar || "",
          image: category.image || "",
        }}
        isEditing={true}
      />
    );
  } catch (error) {
    console.error("Error fetching category:", error);
    notFound();
  }
}
