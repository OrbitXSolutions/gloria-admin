"use client";

// Re-implemented ProductForm (phase 1): core sections, data loading, slug/meta automation, image selection & upload, submit.
// Future phases: draft/save, dirty guards, granular role gating, variant orchestration, richer validation.

import * as React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { ProductFormSchema, type ProductFormData } from "@/lib/validations/product";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { useAction } from "next-safe-action/hooks";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database.types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/custom/combobox";
import { InputWithPopupSelect } from "@/components/ui/custom/input-with-popup-select";
import { KeywordsInput } from "@/components/ui/custom/keywords-input";
import { AttributeInput } from "@/components/admin/attribute-input";
import { FileUpload, FileUploadDropzone, FileUploadList } from "@/components/ui/file-upload";
import { uploadFile, uploadFiles } from "@/lib/utils/upload";
import { getProductImageUrl } from "@/lib/constants/supabase-storage";

// Types from DB
type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Currency = Database["public"]["Tables"]["currencies"]["Row"];
type Country = Database["public"]["Tables"]["countries"]["Row"];

export interface ProductFormProps { product?: Product; mode: "create" | "edit" }

// Utility components kept inline for now (can be extracted later when stable)
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [variantGroups, setVariantGroups] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [allSlugs, setAllSlugs] = useState<Set<string>>(new Set());
  const [allSlugsAr, setAllSlugsAr] = useState<Set<string>>(new Set());

  // Image selection (local before upload)
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [metaThumbFile, setMetaThumbFile] = useState<File | null>(null);
  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingMeta, setUploadingMeta] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const draftFlag = useRef(false); // placeholder for future draft feature

  // Actions
  const { execute: doCreate, isExecuting: creating } = useAction(createProduct, {
    onSuccess: (res) => {
      console.log("Create success", res);
      toast.success("Product created");
      setGlobalError(null);
      // Clear transient media ONLY on success
      setPrimaryFile(null); setGalleryFiles([]); setMetaThumbFile(null);
    },
    onError: ({ error }) => {
      console.error("Create product error (safe-action)", error);
      const msg = error.serverError || "Create failed";
      setGlobalError(msg);
      toast.error(msg);
    }
  });
  const { execute: doUpdate, isExecuting: updating } = useAction(updateProduct, {
    onSuccess: (res) => {
      console.log("Update success", res);
      toast.success("Product updated");
      setGlobalError(null);
      setPrimaryFile(null); setGalleryFiles([]); setMetaThumbFile(null);
      // Redirect to products list after brief delay to allow toast visibility
      setTimeout(() => {
        router.push('/admin/products');
      }, 300);
    },
    onError: ({ error }) => {
      console.error("Update product error (safe-action)", error);
      const msg = error.serverError || "Update failed";
      setGlobalError(msg);
      toast.error(msg);
    }
  });

  // lightweight random slug (no uniqueness set yet) for default to avoid empty validation race
  const initialRandomSlug = React.useMemo(() => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let s = ""; for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }, []);

  const initialRandomSku = React.useMemo(() => {
    const n = Math.floor(Math.random() * 100000); // 0 - 99999
    return `SKU${n.toString().padStart(5, "0")}`;
  }, []);

  const form = useForm<ProductFormData>({
    // Cast resolver to any to avoid transient type duplication issues and allow zod coercion
    resolver: zodResolver(ProductFormSchema) as any,
    defaultValues: {
      name_en: product?.name_en || "",
      name_ar: product?.name_ar || "",
      description_en: product?.description_en || "",
      description_ar: product?.description_ar || "",
      slug: product?.slug || initialRandomSlug,
      slug_ar: product?.slug_ar || "",
      sku: product?.sku || initialRandomSku,
      price: product?.price ?? 0,
      old_price: product?.old_price ?? 0,
      quantity: product?.quantity ?? 5,
      category_id: product?.category_id as number | undefined,
      // country set after fetch to first if not provided
      country_code: product?.country_code || "",
      currency_code: product?.currency_code || "AED",
      variant_group: product?.variant_group || "",
      keywords: product?.keywords ? product.keywords.split(", ").filter(Boolean) : [],
      attributes: (product?.attributes && typeof product.attributes === "object" && !Array.isArray(product.attributes)) ? product.attributes : {},
      attributes_ar: (product?.attributes_ar && typeof product.attributes_ar === "object" && !Array.isArray(product.attributes_ar)) ? product.attributes_ar : {},
      primary_image: product?.primary_image || "",
      images: product?.images || [],
      meta_title_en: product?.meta_title_en || "",
      meta_title_ar: product?.meta_title_ar || "",
      meta_description_en: product?.meta_description_en || "",
      meta_description_ar: product?.meta_description_ar || "",
      meta_thumbnail: product?.meta_thumbnail || "",
      admin_note: product?.admin_note || "",
    }
  });

  // Data load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, currs, couns, variants, slugs, userRes] = await Promise.all([
          supabase.from("categories").select("*").eq("is_deleted", false).order("name_en") as any,
          supabase.from("currencies").select("*").order("name_en") as any,
          supabase.from("countries").select("*").order("name_en") as any,
          supabase.from("products").select("variant_group").eq("is_deleted", false).not("variant_group", "is", null) as any,
          supabase.from("products").select("slug, slug_ar").eq("is_deleted", false) as any,
          supabase.auth.getUser()
        ]);
        if (cancelled) return;
        if (cats.data) setCategories(cats.data);
        if (currs.data) setCurrencies(currs.data);
        if (couns.data) setCountries(couns.data);
        if (variants.data) setVariantGroups(Array.from(new Set((variants.data as any[]).map(v => (v as any).variant_group).filter(Boolean) as string[])));
        if (slugs.data) {
          const s = new Set<string>(); const sAr = new Set<string>();
          (slugs.data as any[]).forEach((r: any) => { if (r.slug) s.add(r.slug); if (r.slug_ar) sAr.add(r.slug_ar); });
          setAllSlugs(s); setAllSlugsAr(sAr);
        }
        const userId = userRes.data.user?.id;
        if (userId) {
          const rolesRes = await supabase.from("user_roles").select("roles(name)").eq("user_id", userId).eq("is_deleted", false);
          if (rolesRes.data) setRoles((rolesRes.data as any[]).map(r => (r as any).roles?.name).filter(Boolean) as string[]);
        }
        // Set first country as default if none provided (create mode only)
        if (!product && couns.data && couns.data.length && !form.getValues("country_code")) {
          form.setValue("country_code", (couns.data[0] as any).code, { shouldDirty: false });
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed loading form data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  // Random slug generation (max length 8) for EN & AR; independent uniqueness sets.
  const generateRandomSlug = useCallback((existing: Set<string>, length = 8): string => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (let attempt = 0; attempt < 500; attempt++) {
      let s = "";
      for (let i = 0; i < length; i++) s += chars[Math.floor(Math.random() * chars.length)];
      if (!existing.has(s)) return s;
    }
    return (Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, length);
  }, []);

  // Auto-generate English slug if not manually edited or invalid.
  useEffect(() => {
    const state = form.getFieldState("slug");
    const current = form.getValues("slug");
    if (state.isDirty && current && current.length === 8 && !allSlugs.has(current)) return;
    if (!current || current.length !== 8 || allSlugs.has(current)) {
      form.setValue("slug", generateRandomSlug(allSlugs), { shouldDirty: false });
    }
  }, [allSlugs, form, generateRandomSlug]);

  // Auto-generate Arabic slug similarly.
  // Auto-generate SKU if user hasn't modified and field empty/invalid pattern
  useEffect(() => {
    const state = form.getFieldState("sku");
    const current = form.getValues("sku");
    if (product?.sku) return; // keep existing when editing
    if (state.isDirty && current) return;
    if (!current) form.setValue("sku", initialRandomSku, { shouldDirty: false });
  }, [form, initialRandomSku, product?.sku]);
  useEffect(() => {
    const state = form.getFieldState("slug_ar");
    const current = form.getValues("slug_ar");
    if (state.isDirty && current && current.length === 8 && !allSlugsAr.has(current)) return;
    if (!current || current.length !== 8 || allSlugsAr.has(current)) {
      form.setValue("slug_ar", generateRandomSlug(allSlugsAr), { shouldDirty: false });
    }
  }, [allSlugsAr, form, generateRandomSlug]);

  // Meta auto-fill only for edit mode (create mode always server-generated & fields hidden)
  useEffect(() => {
    if (mode !== 'edit') return; // skip in create
    const sub = form.watch(values => {
      const v = values as ProductFormData;
      const cat = categories.find(c => c.id === v.category_id);
      const catName = cat?.name_en || "";
      if (v.name_en && !v.meta_title_en) form.setValue("meta_title_en", `${v.name_en}${catName ? ` | ${catName}` : ""}`, { shouldDirty: false });
      if (v.name_ar && !v.meta_title_ar) form.setValue("meta_title_ar", v.name_ar, { shouldDirty: false });
      if (v.name_en && !v.meta_description_en) form.setValue("meta_description_en", `${v.name_en}${catName ? ` in ${catName}` : ""}`, { shouldDirty: false });
      if (v.name_ar && !v.meta_description_ar) form.setValue("meta_description_ar", `${v.name_ar} متوفر الآن.`, { shouldDirty: false });
      if (v.primary_image && !v.meta_thumbnail && !metaThumbFile) form.setValue("meta_thumbnail", v.primary_image, { shouldDirty: false });
    });
    return () => sub.unsubscribe();
  }, [form, categories, metaThumbFile, mode]);

  const isSuperAdmin = roles.some(r => ["superadmin", "admin"].includes(r));

  const onSubmit = async (data: ProductFormData) => {
    if (!data.primary_image && !primaryFile) { toast.error("Primary image required"); return; }
    // Ensure slug exists & meets length requirement before send (handles fast early submit)
    if (!data.slug || data.slug.length !== 8) {
      const newSlug = generateRandomSlug(allSlugs);
      form.setValue("slug", newSlug, { shouldDirty: false });
      data.slug = newSlug;
    }
    if (!data.slug_ar) { // optional but keep stable random if empty
      const newSlugAr = generateRandomSlug(allSlugsAr);
      form.setValue("slug_ar", newSlugAr, { shouldDirty: false });
      data.slug_ar = newSlugAr;
    }
    setGlobalError(null);
    try {
      let payload: ProductFormData = { ...data };
      console.log("Submitting product payload (pre-upload)", payload);
      if (primaryFile) { setUploadingPrimary(true); payload.primary_image = await uploadFile(primaryFile, "products"); }
      if (galleryFiles.length) { setUploadingGallery(true); const paths = await uploadFiles(galleryFiles, "products"); payload.images = [...(payload.images || []), ...paths]; }
      if (metaThumbFile) { setUploadingMeta(true); payload.meta_thumbnail = await uploadFile(metaThumbFile, "products"); }
      console.log("Submitting product payload (post-upload paths)", payload);
      if (mode === "create") doCreate(payload); else if (product) doUpdate({ ...payload, id: product.id });
      draftFlag.current = false;
    } catch (e: any) {
      console.error(e);
      const msg = typeof e?.message === "string" ? e.message : "Save failed";
      setGlobalError(msg);
      toast.error(msg);
    } finally {
      setUploadingPrimary(false); setUploadingGallery(false); setUploadingMeta(false);
    }
  };

  const isSubmitting = creating || updating || uploadingPrimary || uploadingGallery || uploadingMeta;

  // Option data for selectors
  const categoryOptions = categories.map(c => ({ value: c.id.toString(), label: c.name_en || "Unnamed", description: c.name_ar || undefined }));
  const countryOptions = countries.map(c => ({ value: c.code, label: c.name_en, description: c.name_ar || undefined }));
  const currencyOptions = currencies.map(c => ({ value: c.code, label: c.code, description: c.symbol_en || c.symbol_ar || "" }));

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/products"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{mode === "create" ? "Create Product" : `Edit: ${product?.name_en || "Product"}`}</h1>
          <p className="text-muted-foreground text-sm">Fill product details then save.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {globalError && (
            <div className="rounded-md border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
              <strong className="font-medium mr-2">Error:</strong>{globalError}
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left content (main) */}
            <div className="space-y-6 lg:col-span-2">
              <Section title="Basic Information" description="Names, descriptions, category, pricing & media">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name_en" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (EN)*</FormLabel>
                      <FormControl><Input placeholder="English name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="name_ar" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name (AR)</FormLabel>
                      <FormControl><Input placeholder="الاسم" dir="rtl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="description_en" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (EN)</FormLabel>
                    <FormControl><Textarea placeholder="Longer English description" className="min-h-[100px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description_ar" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (AR)</FormLabel>
                    <FormControl><Textarea placeholder="الوصف" dir="rtl" className="min-h-[100px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                {/* Category full row */}
                <FormField control={form.control} name="category_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <FormControl>
                      <Combobox
                        options={categoryOptions}
                        value={field.value ? String(field.value) : undefined}
                        onValueChange={(val) => field.onChange(val ? Number(val) : undefined)}
                        placeholder="Select category..."
                        searchPlaceholder="Search categories..."
                        emptyText="No categories"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Pricing grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price *</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} value={field.value === undefined ? "" : field.value} onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} /></FormControl>
                      <FormMessage />
                    </FormItem>)} />
                  <FormField control={form.control} name="old_price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Old Price</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} value={field.value === undefined ? "" : field.value} onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} /></FormControl>
                      <FormMessage />
                    </FormItem>)} />
                  <FormField control={form.control} name="quantity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl><Input type="number" {...field} value={field.value === undefined ? "" : field.value} onChange={e => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))} /></FormControl>
                      <FormMessage />
                    </FormItem>)} />
                  <FormField control={form.control} name="sku" render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl><Input placeholder="Optional SKU" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Primary image full row */}
                <FormField control={form.control} name="primary_image" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Image *</FormLabel>
                    <FormControl>
                      <FileUpload accept="image/*" maxFiles={1} maxSize={5 * 1024 * 1024} onAccept={(files) => { const f = files[0]; if (f) { setPrimaryFile(f); toast.success("Primary image selected"); } }}>
                        <FileUploadDropzone>
                          <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                            {primaryFile ? (
                              <>
                                <img src={URL.createObjectURL(primaryFile)} alt="Primary preview" className="h-32 w-32 object-cover rounded" />
                                <p>{primaryFile.name}</p>
                              </>
                            ) : field.value ? (
                              <>
                                <img src={getProductImageUrl(field.value)} alt="Existing primary" className="h-32 w-32 object-cover rounded" />
                                <p>Current image</p>
                              </>
                            ) : (
                              <>
                                <p>Drop or click to select</p>
                                <p className="text-xs">PNG/JPG/WEBP up to 5MB</p>
                              </>
                            )}
                          </div>
                        </FileUploadDropzone>
                        <FileUploadList />
                      </FileUpload>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Gallery full row */}
                <FormField control={form.control} name="images" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gallery Images</FormLabel>
                    <FormControl>
                      <FileUpload accept="image/*" multiple maxFiles={10} maxSize={5 * 1024 * 1024} onAccept={(files) => { setGalleryFiles(prev => [...prev, ...files]); toast.success(`${files.length} gallery image(s) added`); }}>
                        <FileUploadDropzone>
                          <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                            <p>Drop or click to add</p>
                            <p className="text-xs">Up to 10 images</p>
                          </div>
                        </FileUploadDropzone>
                        <FileUploadList orientation="horizontal" />
                      </FileUpload>
                    </FormControl>
                    {(galleryFiles.length > 0 || (field.value && field.value.length > 0)) && (
                      <div className="mt-2 space-y-2">
                        {galleryFiles.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {galleryFiles.map((f, i) => (
                              <div key={i} className="relative group">
                                <img src={URL.createObjectURL(f)} alt={f.name} className="h-20 w-full object-cover rounded" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (typeof window !== 'undefined' && !window.confirm('Remove this new image?')) return;
                                    setGalleryFiles(galleryFiles.filter((_, idx) => idx !== i));
                                  }}
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white text-xs opacity-0 group-hover:opacity-100 transition"
                                  aria-label="Remove new image"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {field.value && field.value.length > 0 && (
                          <div>
                            <p className="text-xs mb-1 text-muted-foreground">Existing:</p>
                            <div className="grid grid-cols-3 gap-2">
                              {field.value.map((img, i) => (
                                <div key={i} className="relative group">
                                  <img src={getProductImageUrl(img)} alt={img} className="h-20 w-full object-cover rounded" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (typeof window !== 'undefined' && !window.confirm('Remove this existing image from gallery?')) return;
                                      const next = (field.value || []).filter((_, idx) => idx !== i);
                                      field.onChange(next);
                                      toast.success("Image removed");
                                    }}
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white text-xs opacity-0 group-hover:opacity-100 transition"
                                    aria-label="Remove existing image"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Inline save button under gallery for both create & edit modes */}
                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="secondary" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === "create" ? "Create Product" : "Update Product"}
                  </Button>
                </div>
              </Section>

              {/* Pricing section removed - merged into Basic Information */}

              <Section title="Classification" description="Country, currency & variants">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="country_code" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <FormControl>
                        <Combobox
                          options={countryOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select country..."
                          searchPlaceholder="Search countries..."
                          emptyText="No countries"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="currency_code" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency *</FormLabel>
                      <FormControl>
                        <Combobox
                          options={currencyOptions}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select currency..."
                          searchPlaceholder="Search currencies..."
                          emptyText="No currencies"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="mt-4">
                  <FormField control={form.control} name="variant_group" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variant Group</FormLabel>
                      <FormControl>
                        <InputWithPopupSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          suggestions={variantGroups}
                          placeholder="Type or pick group"
                          selectPlaceholder="Existing groups"
                          searchPlaceholder="Search groups..."
                          emptyText="No groups"
                        />
                      </FormControl>
                      <FormDescription>Same group name links products as variants.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </Section>

              <Section title="Attributes" description="Bilingual attribute key/value pairs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="attributes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attributes (EN)</FormLabel>
                      <FormControl>
                        <AttributeInput language="en" value={field.value ?? null} onChange={field.onChange} label="" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="attributes_ar" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attributes (AR)</FormLabel>
                      <FormControl>
                        <AttributeInput language="ar" value={field.value ?? null} onChange={field.onChange} label="" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </Section>

              <Section title="Admin Notes">
                <FormField control={form.control} name="admin_note" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl><Textarea className="min-h-[80px]" placeholder="Only visible to admins" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </Section>

              {mode === 'edit' && (
                <Section title="SEO & Metadata" description="Auto-generated on create. You can adjust here if needed.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="meta_title_en" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Title (EN)</FormLabel>
                        <FormControl><Input placeholder="SEO title" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="meta_title_ar" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Title (AR)</FormLabel>
                        <FormControl><Input placeholder="عنوان" dir="rtl" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="meta_description_en" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Description (EN)</FormLabel>
                        <FormControl><Textarea className="min-h-[80px]" placeholder="Search snippet" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="meta_description_ar" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Description (AR)</FormLabel>
                        <FormControl><Textarea dir="rtl" className="min-h-[80px]" placeholder="وصف" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="meta_thumbnail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Thumbnail</FormLabel>
                      <FormControl>
                        <FileUpload accept="image/*" maxFiles={1} maxSize={2 * 1024 * 1024} onAccept={(files) => { const f = files[0]; if (f) { setMetaThumbFile(f); toast.success("Meta thumbnail selected"); } }}>
                          <FileUploadDropzone>
                            <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                              {metaThumbFile ? (
                                <>
                                  <img src={URL.createObjectURL(metaThumbFile)} alt="Meta thumbnail" className="h-24 w-24 object-cover rounded" />
                                  <p>{metaThumbFile.name}</p>
                                </>
                              ) : field.value ? (
                                <>
                                  <img src={getProductImageUrl(field.value)} alt="Existing meta thumbnail" className="h-24 w-24 object-cover rounded" />
                                  <p>Current thumbnail</p>
                                </>
                              ) : (
                                <>
                                  <p>Drop or click to select</p>
                                  <p className="text-xs">PNG/JPG/WEBP up to 2MB</p>
                                </>
                              )}
                            </div>
                          </FileUploadDropzone>
                          <FileUploadList />
                        </FileUpload>
                      </FormControl>
                      <FormDescription>Used for social sharing (approx 1200x630).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="keywords" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords</FormLabel>
                      <FormControl><KeywordsInput value={field.value || []} onChange={field.onChange} placeholder="Add keyword" /></FormControl>
                      <FormDescription>Improves internal and external search.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </Section>
              )}

              {/* Slugs moved to end for clarity */}
              <Section title="Slugs" description="Auto-generated 8 character identifiers. You can override if needed.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (EN)*</FormLabel>
                      <FormControl><Input placeholder="auto" maxLength={8} {...field} /></FormControl>
                      <FormDescription>English identifier (8 chars)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="slug_ar" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (AR)</FormLabel>
                      <FormControl><Input placeholder="تلقائي" dir="rtl" maxLength={8} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </Section>
            </div>

            {/* Right sidebar now empty (reserved for future: status, analytics, etc.) */}
            <div className="space-y-6" />
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            {(primaryFile || galleryFiles.length || metaThumbFile) && (
              <div className="flex items-center gap-2 text-xs text-amber-600">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>New media ready to upload</span>
              </div>
            )}
            <Button variant="outline" type="button" asChild>
              <Link href="/admin/products">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {uploadingPrimary || uploadingGallery || uploadingMeta ? "Uploading..." : mode === "create" ? "Create Product" : "Update Product"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
