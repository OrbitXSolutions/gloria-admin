"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "next-safe-action/hooks"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Combobox } from "@/components/ui/custom/combobox"
import { KeywordsInput } from "@/components/ui/custom/keywords-input";
import { AttributeInput } from "@/components/admin/attribute-input"
import { ProductFormSchema, type ProductFormData } from "@/lib/validations/product"
import { createProduct, updateProduct } from "@/lib/actions/products"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/types/database.types"
import { useState } from "react"

type Product = Database["public"]["Tables"]["products"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]
type Currency = Database["public"]["Tables"]["currencies"]["Row"]
type Country = Database["public"]["Tables"]["countries"]["Row"]

interface ProductFormProps {
  product?: Product
  mode: "create" | "edit"
}

export function ProductForm({ product, mode }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)

  const { execute: executeCreate, isExecuting: isCreating } = useAction(createProduct, {
    onSuccess: () => {
      toast.success("Product created successfully!")
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Failed to create product")
    },
  })

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(updateProduct, {
    onSuccess: () => {
      toast.success("Product updated successfully!")
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Failed to update product")
    },
  })

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
      keywords: product?.keywords ? product.keywords.split(", ").filter(Boolean) : [],
      attributes:
        typeof product?.attributes === "object" && !Array.isArray(product?.attributes) && product?.attributes !== null
          ? product.attributes
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
  })

  // Load dropdown data
  React.useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      const [categoriesRes, currenciesRes, countriesRes] = await Promise.all([
        supabase.from("categories").select("*").eq("is_deleted", false).order("name_en"),
        supabase.from("currencies").select("*").order("name_en"),
        supabase.from("countries").select("*").order("name_en"),
      ])

      if (categoriesRes.data) setCategories(categoriesRes.data)
      if (currenciesRes.data) setCurrencies(currenciesRes.data)
      if (countriesRes.data) setCountries(countriesRes.data)

      setLoading(false)
    }

    loadData()
  }, [])

  // Auto-generate slug from name
  const watchNameEn = form.watch("name_en")
  React.useEffect(() => {
    if (watchNameEn && mode === "create") {
      const slug = watchNameEn
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
      form.setValue("slug", slug)
    }
  }, [watchNameEn, mode, form])

  const onSubmit = (data: ProductFormData) => {
    if (mode === "create") {
      executeCreate(data)
    } else if (product) {
      executeUpdate({ ...data, id: product.id })
    }
  }

  const isSubmitting = isCreating || isUpdating

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const categoryOptions = categories.map((category) => ({
    value: category.id.toString(),
    label: category.name_en || "Unnamed Category",
    description: category.name_ar ?? undefined,
  }))

  const currencyOptions = currencies.map((currency) => ({
    value: currency.code,
    label: `${currency.name_en} (${currency.code})`,
    description: `${currency.symbol_en || currency.symbol_ar || ""}`,
  }))

  const countryOptions = countries.map((country) => ({
    value: country.code,
    label: country.name_en,
    description: country.name_ar ?? undefined,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
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
                <CardDescription>Essential product details and descriptions</CardDescription>
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
                          <Input placeholder="أدخل اسم المنتج" {...field} dir="rtl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Descriptions */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="description_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (English)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter product description" className="min-h-[100px]" {...field} />
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
                          <Textarea placeholder="أدخل وصف المنتج" className="min-h-[100px]" dir="rtl" {...field} />
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
                        <FormDescription>Unique product identifier</FormDescription>
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
                        <FormDescription>Auto-generated from name</FormDescription>
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
                          <Input placeholder="اسم-المنتج" {...field} dir="rtl" />
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
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
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
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>Original price for discount display</FormDescription>
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
                          onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Category and Location */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Category & Location</CardTitle>
                <CardDescription>Organize and localize your product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            onValueChange={(value) => field.onChange(Number.parseInt(value))}
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
                        <Input placeholder="e.g., perfume-collection-2024" {...field} />
                      </FormControl>
                      <FormDescription>Group products as variants by using the same variant group name</FormDescription>
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
                      <FormDescription>Keywords help customers find your product</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Product Attributes */}
            <Card className="lg:col-span-3">
              <FormField
                control={form.control}
                name="attributes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <AttributeInput value={field.value ?? null} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>

            {/* SEO & Meta */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>SEO & Metadata</CardTitle>
                <CardDescription>Optimize for search engines and social sharing</CardDescription>
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
                          <Input placeholder="SEO title for search engines" {...field} />
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
                          <Input placeholder="عنوان SEO لمحركات البحث" {...field} dir="rtl" />
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
                      <FormLabel>Meta Thumbnail URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormDescription>Image for social media sharing</FormDescription>
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
                <CardDescription>Internal notes for administrative purposes</CardDescription>
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
                      <FormDescription>These notes are only visible to administrators</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <Button variant="outline" asChild>
              <Link href="/admin/products">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {mode === "create" ? "Create Product" : "Update Product"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
