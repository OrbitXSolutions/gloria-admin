import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Edit,
  ArrowLeft,
  Calendar,
  Image as ImageIcon,
  Globe,
  Hash,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCategoryById } from "@/lib/actions/categories";

interface CategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const categoryId = +(await params).id;

  if (isNaN(categoryId)) {
    notFound();
  }

  try {
    const category = await getCategoryById(categoryId);

    if (!category) {
      notFound();
    }

    const formatDate = (dateString: string | null) => {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/categories">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{category.name_en}</h1>
              <p className="text-muted-foreground">
                Category details and information
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href={`/admin/categories/${category.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Category
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Category names and identifiers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      English Name
                    </label>
                    <p className="text-lg font-medium">
                      {category.name_en || "—"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Arabic Name
                    </label>
                    <p className="text-lg font-medium" dir="rtl">
                      {category.name_ar || "—"}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      English Slug
                    </label>
                    <Badge variant="secondary" className="font-mono">
                      {category.slug}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Arabic Slug
                    </label>
                    <Badge variant="secondary" className="font-mono" dir="rtl">
                      {category.slug_ar}
                    </Badge>
                  </div>
                </div>

                {category.image && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                        <ImageIcon className="h-4 w-4" />
                        Category Image
                      </label>
                      <div className="relative w-full max-w-md">
                        <img
                          src={category.image}
                          alt={category.name_en || "Category image"}
                          className="rounded-lg border w-full h-48 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  SEO Settings
                </CardTitle>
                <CardDescription>
                  Search engine optimization metadata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        English Meta Title
                      </label>
                      <p className="mt-1">{category.meta_title_en || "—"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        English Meta Description
                      </label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {category.meta_description_en || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Arabic Meta Title
                      </label>
                      <p className="mt-1" dir="rtl">
                        {category.meta_title_ar || "—"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Arabic Meta Description
                      </label>
                      <p
                        className="mt-1 text-sm text-muted-foreground"
                        dir="rtl"
                      >
                        {category.meta_description_ar || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timestamps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created
                  </label>
                  <p className="text-sm">{formatDate(category.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </label>
                  <p className="text-sm">{formatDate(category.updated_at)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild className="w-full">
                  <Link href={`/admin/categories/${category.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Category
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/admin/products?category=${category.id}">
                    View Products
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching category:", error);
    notFound();
  }
}
