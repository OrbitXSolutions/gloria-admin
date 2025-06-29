"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  categoryFormSchema,
  type CategoryFormData,
} from "@/lib/validations/category";
import {
  createCategory,
  updateCategory,
  checkSlugExists,
} from "@/lib/actions/categories";

interface CategoryFormProps {
  initialData?: CategoryFormData & { id?: number };
  isEditing?: boolean;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export function CategoryForm({
  initialData,
  isEditing = false,
}: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slugLoading, setSlugLoading] = useState(false);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name_en: initialData?.name_en || "",
      name_ar: initialData?.name_ar || "",
      slug: initialData?.slug || "",
      slug_ar: initialData?.slug_ar || "",
      meta_title_en: initialData?.meta_title_en || "",
      meta_title_ar: initialData?.meta_title_ar || "",
      meta_description_en: initialData?.meta_description_en || "",
      meta_description_ar: initialData?.meta_description_ar || "",
      image: initialData?.image || "",
    },
  });

  const watchNameEn = form.watch("name_en");
  const watchNameAr = form.watch("name_ar");

  // Auto-generate slugs when name changes
  const handleNameChange = async (value: string, isArabic: boolean = false) => {
    const slug = generateSlug(value);
    const slugField = isArabic ? "slug_ar" : "slug";

    if (slug && slug !== form.getValues(slugField)) {
      form.setValue(slugField, slug);

      // Check if slug already exists
      if (slug.length > 0) {
        setSlugLoading(true);
        try {
          const exists = await checkSlugExists({
            slug,
            excludeId: initialData?.id,
          });
          if (exists) {
            form.setError(slugField, {
              type: "manual",
              message: `This ${
                isArabic ? "Arabic" : "English"
              } slug already exists`,
            });
          } else {
            form.clearErrors(slugField);
          }
        } catch (error) {
          console.error("Error checking slug:", error);
        } finally {
          setSlugLoading(false);
        }
      }
    }
  };

  const handleSlugChange = async (value: string, isArabic: boolean = false) => {
    const slug = generateSlug(value);
    const slugField = isArabic ? "slug_ar" : "slug";

    form.setValue(slugField, slug);

    if (slug.length > 0) {
      setSlugLoading(true);
      try {
        const exists = await checkSlugExists({
          slug,
          excludeId: initialData?.id,
        });
        if (exists) {
          form.setError(slugField, {
            type: "manual",
            message: `This ${
              isArabic ? "Arabic" : "English"
            } slug already exists`,
          });
        } else {
          form.clearErrors(slugField);
        }
      } catch (error) {
        console.error("Error checking slug:", error);
      } finally {
        setSlugLoading(false);
      }
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    startTransition(async () => {
      try {
        if (isEditing && initialData?.id) {
          await updateCategory({
            id: initialData?.id,

            ...data,
          });
          toast.success("Category updated successfully");
          router.push("/admin/categories");
        } else {
          await createCategory(data);
          toast.success("Category created successfully");
          router.push("/admin/categories");
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "An error occurred"
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {isEditing ? "Edit Category" : "Create Category"}
        </h1>
        <p className="text-muted-foreground">
          {isEditing
            ? "Update the category information below."
            : "Fill in the information below to create a new category."}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                The main details for your category. Names and slugs are
                required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>English Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Category name in English"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleNameChange(e.target.value, false);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arabic Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="اسم التصنيف بالعربية"
                          dir="rtl"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleNameChange(e.target.value, true);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        English Slug *
                        {slugLoading && (
                          <Badge variant="secondary" className="text-xs">
                            Checking...
                          </Badge>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="category-slug"
                          {...field}
                          onChange={(e) =>
                            handleSlugChange(e.target.value, false)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Arabic Slug *
                        {slugLoading && (
                          <Badge variant="secondary" className="text-xs">
                            Checking...
                          </Badge>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="تصنيف-عربي"
                          dir="rtl"
                          {...field}
                          onChange={(e) =>
                            handleSlugChange(e.target.value, true)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/category-image.jpg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Optimize your category for search engines. These fields are
                optional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="meta_title_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>English Meta Title</FormLabel>
                      <FormControl>
                        <Input placeholder="SEO title in English" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_title_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arabic Meta Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="عنوان SEO بالعربية"
                          dir="rtl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="meta_description_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>English Meta Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="SEO description in English"
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_description_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arabic Meta Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="وصف SEO بالعربية"
                          dir="rtl"
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || slugLoading}>
              {isPending
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                ? "Update Category"
                : "Create Category"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
