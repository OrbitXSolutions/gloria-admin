"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/custom/combobox";
import { InputWithPopupSelect } from "@/components/ui/custom/input-with-popup-select";
import { KeywordsInput } from "@/components/ui/custom/keywords-input";
import { AttributeInput } from "@/components/admin/attribute-input";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
  FileUploadList,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemDelete,
} from "@/components/ui/file-upload";
import { uploadFile, uploadFiles } from "@/lib/utils/upload";
import { getProductImageUrl } from "@/lib/constants/supabase-storage";
import {
  ProductFormSchema,
  type ProductFormData,
} from "@/lib/validations/product";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database.types";
import { useState } from "react";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Currency = Database["public"]["Tables"]["currencies"]["Row"];
type Country = Database["public"]["Tables"]["countries"]["Row"];

interface ProductFormProps {
  product?: Product;
  mode: "create" | "edit";
}

export function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [variantGroups, setVariantGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  // Local file storage before upload
  const [selectedPrimaryImage, setSelectedPrimaryImage] = useState<File | null>(
    null
  );
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<File[]>(
    []
  );
  const [selectedMetaThumbnail, setSelectedMetaThumbnail] =
    useState<File | null>(null);

  const { execute: executeCreate, isExecuting: isCreating } = useAction(
    createProduct,
    {
      onSuccess: () => {
        toast.success("Product created successfully!");
        router.push("/admin/products");
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Failed to create product");
      },
    }
  );

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(
    updateProduct,
    {
      onSuccess: () => {
        toast.success("Product updated successfully!");
        router.push("/admin/products");
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Failed to update product");
      },
    }
  );

  const form = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name_en: product?.name_en || "",
      name_ar: product?.name_ar || "",
      description_en: product?.description_en || "",
      description_ar: product?.description_ar || "",
      slug: product?.slug || "",
      slug_ar: product?.slug_ar || "",
      sku: product?.sku || "",
      price: product?.price || 0,
      old_price: product?.old_price || undefined,
      quantity: product?.quantity || 0,
      category_id: product?.category_id || undefined,
      country_code: product?.country_code || "",
      currency_code: product?.currency_code || "",
      variant_group: product?.variant_group || "",
      keywords: product?.keywords
        ? product.keywords.split(", ").filter(Boolean)
        : [],
      attributes:
        typeof product?.attributes === "object" &&
        !Array.isArray(product?.attributes) &&
        product?.attributes !== null
          ? product.attributes
          : {},
      attributes_ar:
        typeof product?.attributes_ar === "object" &&
        !Array.isArray(product?.attributes_ar) &&
        product?.attributes_ar !== null
          ? product.attributes_ar
          : {},
      primary_image: product?.primary_image || "",
      images: product?.images || [],
      meta_title_en: product?.meta_title_en || "",
      meta_title_ar: product?.meta_title_ar || "",
      meta_description_en: product?.meta_description_en || "",
      meta_description_ar: product?.meta_description_ar || "",
      meta_thumbnail: product?.meta_thumbnail || "",
      admin_note: product?.admin_note || "",
    },
  });

  // Load dropdown data
  React.useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      const [categoriesRes, currenciesRes, countriesRes, variantGroupsRes] =
        await Promise.all([
          supabase
            .from("categories")
            .select("*")
            .eq("is_deleted", false)
            .order("name_en"),
          supabase.from("currencies").select("*").order("name_en"),
          supabase.from("countries").select("*").order("name_en"),
          supabase
            .from("products")
            .select("variant_group")
            .eq("is_deleted", false)
            .not("variant_group", "is", null)
            .order("variant_group"),
        ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (currenciesRes.data) setCurrencies(currenciesRes.data);
      if (countriesRes.data) setCountries(countriesRes.data);

      // Extract unique variant groups
      if (variantGroupsRes.data) {
        const uniqueVariantGroups = Array.from(
          new Set(
            variantGroupsRes.data
              .map((item) => item.variant_group)
              .filter(Boolean) as string[]
          )
        );
        setVariantGroups(uniqueVariantGroups);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  // Auto-generate slug from name
  const watchNameEn = form.watch("name_en");
  React.useEffect(() => {
    if (watchNameEn && mode === "create") {
      const slug = watchNameEn
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      form.setValue("slug", slug);
    }
  }, [watchNameEn, mode, form]);

  // Auto-generate Arabic slug from Arabic name
  const watchNameAr = form.watch("name_ar");
  React.useEffect(() => {
    if (watchNameAr && mode === "create") {
      const slugAr = watchNameAr
        .toLowerCase()
        // Remove special characters except Arabic letters, numbers, spaces, and hyphens
        .replace(
          /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s-]/g,
          ""
        )
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      form.setValue("slug_ar", slugAr);
    }
  }, [watchNameAr, mode, form]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Upload files before submitting
      let finalData = { ...data };

      // Upload primary image if selected
      if (selectedPrimaryImage) {
        setUploadingPrimary(true);
        const primaryImagePath = await uploadFile(
          selectedPrimaryImage,
          "products"
        );
        finalData.primary_image = primaryImagePath;
      }

      // Upload gallery images if selected
      if (selectedGalleryImages.length > 0) {
        setUploadingGallery(true);
        const galleryPaths = await uploadFiles(
          selectedGalleryImages,
          "products"
        );
        finalData.images = [...(finalData.images || []), ...galleryPaths];
      }

      // Upload meta thumbnail if selected
      if (selectedMetaThumbnail) {
        setUploadingThumbnail(true);
        const metaThumbnailPath = await uploadFile(
          selectedMetaThumbnail,
          "products"
        );
        finalData.meta_thumbnail = metaThumbnailPath;
      }

      // Submit the form with uploaded file paths
      if (mode === "create") {
        executeCreate(finalData);
      } else if (product) {
        executeUpdate({ ...finalData, id: product.id });
      }

      // Clear selected files after successful submission
      setSelectedPrimaryImage(null);
      setSelectedGalleryImages([]);
      setSelectedMetaThumbnail(null);
    } catch (error) {
      toast.error("Failed to upload files. Please try again.");
      console.error("Upload error:", error);
    } finally {
      setUploadingPrimary(false);
      setUploadingGallery(false);
      setUploadingThumbnail(false);
    }
  };

  const isSubmitting =
    isCreating ||
    isUpdating ||
    uploadingPrimary ||
    uploadingGallery ||
    uploadingThumbnail;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const categoryOptions = categories.map((category) => ({
    value: category.id.toString(),
    label: category.name_en || "Unnamed Category",
    description: category.name_ar ?? undefined,
  }));

  const currencyOptions = currencies.map((currency) => ({
    value: currency.code,
    label: `${currency.code}`,
    description: `${currency.symbol_en || currency.symbol_ar || ""}`,
  }));

  const countryOptions = countries.map((country) => ({
    value: country.code,
    label: country.name_en,
    description: country.name_ar ?? undefined,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 w-full">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "create" ? "Create Product" : "Edit Product"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? "Add a new product to your store"
                : `Editing: ${product?.name_en || "Unnamed Product"}`}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Basic Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Essential product details and descriptions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Names */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name (English) *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
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
                        <FormLabel>Product Name (Arabic)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="أدخل اسم المنتج"
                            {...field}
                            dir="rtl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="primary_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Image</FormLabel>
                      <FormControl>
                        <FileUpload
                          accept="image/*"
                          maxFiles={1}
                          maxSize={5 * 1024 * 1024} // 5MB
                          onAccept={(files) => {
                            const file = files[0];
                            if (file) {
                              setSelectedPrimaryImage(file);
                              toast.success("Primary image selected!");
                            }
                          }}
                        >
                          <FileUploadDropzone>
                            <div className="flex flex-col items-center gap-2 text-center">
                              <div className="text-sm text-muted-foreground">
                                {selectedPrimaryImage ? (
                                  <div className="space-y-2">
                                    <img
                                      src={URL.createObjectURL(
                                        selectedPrimaryImage
                                      )}
                                      alt="Selected primary image"
                                      className="h-32 w-32 object-cover rounded-lg mx-auto"
                                    />
                                    <p>Selected: {selectedPrimaryImage.name}</p>
                                    <p className="text-xs">
                                      Click to replace primary image
                                    </p>
                                  </div>
                                ) : field.value ? (
                                  <div className="space-y-2">
                                    <div className="relative inline-block">
                                      <img
                                        src={getProductImageUrl(field.value)}
                                        alt="Current primary image"
                                        className="h-32 w-32 object-cover rounded-lg mx-auto"
                                      />
                                      {mode === "edit" && (
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="sm"
                                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                          onClick={() => {
                                            field.onChange("");
                                            toast.success(
                                              "Primary image removed"
                                            );
                                          }}
                                        >
                                          ×
                                        </Button>
                                      )}
                                    </div>
                                    <p>Current primary image</p>
                                    <p className="text-xs">
                                      Click to replace primary image
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    <p>
                                      Drop your primary image here, or click to
                                      browse
                                    </p>
                                    <p className="text-xs">
                                      PNG, JPG, WEBP up to 5MB
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </FileUploadDropzone>
                          <FileUploadList>
                            {/* File upload list will show selected files */}
                          </FileUploadList>
                        </FileUpload>
                      </FormControl>
                      <FormDescription>
                        This image will be used as the main product photo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Descriptions */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (English)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter product description"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description_ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Arabic)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="أدخل وصف المنتج"
                            className="min-h-[100px]"
                            dir="rtl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* SKU and Slugs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU *</FormLabel>
                        <FormControl>
                          <Input placeholder="PROD-001" {...field} />
                        </FormControl>
                        <FormDescription>
                          Unique product identifier
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug (English) *</FormLabel>
                        <FormControl>
                          <Input placeholder="product-name" {...field} />
                        </FormControl>
                        <FormDescription>
                          Auto-generated from name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug_ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug (Arabic)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="اسم-المنتج"
                            {...field}
                            dir="rtl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing and Inventory */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Inventory</CardTitle>
                <CardDescription>Set pricing and stock levels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              Number.parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="old_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compare at Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              Number.parseFloat(e.target.value) || undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Original price for discount display
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number.parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Category and Location */}
            <Card className="lg:col-span-2 ">
              <CardHeader>
                <CardTitle>Category & Location</CardTitle>
                <CardDescription>
                  Organize and localize your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <FormControl>
                          <Combobox
                            options={categoryOptions}
                            value={field.value?.toString()}
                            onValueChange={(value) =>
                              field.onChange(Number.parseInt(value))
                            }
                            placeholder="Select category..."
                            searchPlaceholder="Search categories..."
                            emptyText="No categories found."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <FormControl>
                          <Combobox
                            options={countryOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select country..."
                            searchPlaceholder="Search countries..."
                            emptyText="No countries found."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency *</FormLabel>
                        <FormControl>
                          <Combobox
                            options={currencyOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select currency..."
                            searchPlaceholder="Search currencies..."
                            emptyText="No currencies found."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="variant_group"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variant Group</FormLabel>
                      <FormControl>
                        <InputWithPopupSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          suggestions={variantGroups}
                          placeholder="Type variant group name or select existing..."
                          selectPlaceholder="Select existing group"
                          searchPlaceholder="Search variant groups..."
                          emptyText="No variant groups found."
                        />
                      </FormControl>
                      <FormDescription>
                        Group products as variants by using the same variant
                        group name. You can type a new name or select an
                        existing one.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Keywords */}
            <Card>
              <CardHeader>
                <CardTitle>Keywords</CardTitle>
                <CardDescription>SEO and search keywords</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search Keywords</FormLabel>
                      <FormControl>
                        <KeywordsInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add keywords for better search..."
                        />
                      </FormControl>
                      <FormDescription>
                        Keywords help customers find your product
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Gallery Images */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Product Gallery</CardTitle>
                <CardDescription>
                  Additional product images for the gallery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gallery Images</FormLabel>
                      <FormControl>
                        <FileUpload
                          accept="image/*"
                          maxFiles={10}
                          maxSize={5 * 1024 * 1024} // 5MB
                          multiple
                          onAccept={(files) => {
                            setSelectedGalleryImages((prev) => [
                              ...prev,
                              ...files,
                            ]);
                            toast.success(
                              `${files.length} image(s) selected for gallery!`
                            );
                          }}
                        >
                          <FileUploadDropzone>
                            <div className="flex flex-col items-center gap-2 text-center">
                              <div className="text-sm text-muted-foreground">
                                <>
                                  <p>Drop images here, or click to browse</p>
                                  <p className="text-xs">
                                    PNG, JPG, WEBP up to 5MB each (max 10
                                    images)
                                  </p>
                                </>
                              </div>
                            </div>
                          </FileUploadDropzone>
                          <FileUploadList orientation="horizontal" />
                        </FileUpload>
                      </FormControl>

                      {/* Show selected gallery images */}
                      {selectedGalleryImages.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">
                              Selected Gallery Images (
                              {selectedGalleryImages.length}):
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedGalleryImages([]);
                                toast.success("All selected images cleared");
                              }}
                            >
                              Clear all selected
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {selectedGalleryImages.map((file, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Selected gallery image ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    setSelectedGalleryImages((prev) =>
                                      prev.filter((_, i) => i !== index)
                                    );
                                  }}
                                >
                                  ×
                                </Button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg truncate">
                                  {file.name}
                                </div>
                                <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                                  NEW
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Show existing images */}
                      {field.value && field.value.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">
                            Current Gallery Images ({field.value.length}):
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {field.value.map((imagePath, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={getProductImageUrl(imagePath)}
                                  alt={`Gallery image ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                                {mode === "edit" && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      const newImages =
                                        field.value?.filter(
                                          (_, i) => i !== index
                                        ) || [];
                                      field.onChange(newImages);
                                      toast.success("Gallery image removed");
                                    }}
                                  >
                                    ×
                                  </Button>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg truncate">
                                  {imagePath}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <FormDescription>
                        Upload multiple images to showcase your product from
                        different angles
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Product Attributes - Updated to handle both English and Arabic */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="attributes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <AttributeInput
                          value={field.value ?? null}
                          onChange={field.onChange}
                          language="en"
                          label="Product Attributes (English)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="attributes_ar"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <AttributeInput
                          value={field.value ?? null}
                          onChange={field.onChange}
                          language="ar"
                          label="Product Attributes (Arabic)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* SEO & Meta */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>SEO & Metadata</CardTitle>
                <CardDescription>
                  Optimize for search engines and social sharing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="meta_title_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Title (English)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="SEO title for search engines"
                            {...field}
                          />
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
                        <FormLabel>Meta Title (Arabic)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="عنوان SEO لمحركات البحث"
                            {...field}
                            dir="rtl"
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
                        <FormLabel>Meta Description (English)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description for search results"
                            className="min-h-[80px]"
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
                        <FormLabel>Meta Description (Arabic)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="وصف مختصر لنتائج البحث"
                            className="min-h-[80px]"
                            dir="rtl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="meta_thumbnail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Thumbnail</FormLabel>
                      <FormControl>
                        <FileUpload
                          accept="image/*"
                          maxFiles={1}
                          maxSize={2 * 1024 * 1024} // 2MB for social media
                          onAccept={(files) => {
                            const file = files[0];
                            if (file) {
                              setSelectedMetaThumbnail(file);
                              toast.success("Meta thumbnail selected!");
                            }
                          }}
                        >
                          <FileUploadDropzone>
                            <div className="flex flex-col items-center gap-2 text-center">
                              <div className="text-sm text-muted-foreground">
                                {selectedMetaThumbnail ? (
                                  <div className="space-y-2">
                                    <img
                                      src={URL.createObjectURL(
                                        selectedMetaThumbnail
                                      )}
                                      alt="Selected meta thumbnail"
                                      className="h-24 w-24 object-cover rounded-lg mx-auto"
                                    />
                                    <p>
                                      Selected: {selectedMetaThumbnail.name}
                                    </p>
                                    <p className="text-xs">
                                      Click to replace meta thumbnail
                                    </p>
                                  </div>
                                ) : field.value ? (
                                  <div className="space-y-2">
                                    <div className="relative inline-block">
                                      <img
                                        src={getProductImageUrl(field.value)}
                                        alt="Current meta thumbnail"
                                        className="h-24 w-24 object-cover rounded-lg mx-auto"
                                      />
                                      {mode === "edit" && (
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="sm"
                                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                          onClick={() => {
                                            field.onChange("");
                                            toast.success(
                                              "Meta thumbnail removed"
                                            );
                                          }}
                                        >
                                          ×
                                        </Button>
                                      )}
                                    </div>
                                    <p>Current meta thumbnail</p>
                                    <p className="text-xs">
                                      Click to replace meta thumbnail
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    <p>
                                      Drop meta thumbnail here, or click to
                                      browse
                                    </p>
                                    <p className="text-xs">
                                      PNG, JPG, WEBP up to 2MB (optimized for
                                      social media)
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </FileUploadDropzone>
                          <FileUploadList>
                            {/* File upload list will show selected files */}
                          </FileUploadList>
                        </FileUpload>
                      </FormControl>
                      <FormDescription>
                        Image for social media sharing (recommended: 1200x630px)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Admin Notes */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Admin Notes</CardTitle>
                <CardDescription>
                  Internal notes for administrative purposes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="admin_note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any internal notes about this product..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        These notes are only visible to administrators
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            {/* Show pending uploads indicator */}
            {(selectedPrimaryImage ||
              selectedGalleryImages.length > 0 ||
              selectedMetaThumbnail) && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span>
                  {[
                    selectedPrimaryImage && "Primary image",
                    selectedGalleryImages.length > 0 &&
                      `${selectedGalleryImages.length} gallery image(s)`,
                    selectedMetaThumbnail && "Meta thumbnail",
                  ]
                    .filter(Boolean)
                    .join(", ")}{" "}
                  ready to upload
                </span>
              </div>
            )}

            <Button variant="outline" asChild>
              <Link href="/admin/products">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              {uploadingPrimary || uploadingGallery || uploadingThumbnail
                ? "Uploading Images..."
                : mode === "create"
                ? "Create Product"
                : "Update Product"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
