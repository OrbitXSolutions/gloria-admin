import { z } from "zod";

const ProductColorSchema = z.object({
  hex: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color format"),
  name: z.string().min(1, "Color name is required"),
});

const ProductAttributesSchema = z.record(z.any()).optional();

export const ProductFormSchema = z.object({
  name_en: z.string().min(1, "English name is required"),
  name_ar: z.string().optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  slug: z.string().min(1, "English slug is required"),
  slug_ar: z.string().optional(),
  // SKU now optional (allow empty string). If provided, must be a string.
  sku: z.string().optional(),
  // Use coercion so form string inputs are converted to numbers automatically
  price: z.coerce.number().min(0, "Price must be positive"),
  old_price: z.preprocess(v => (v === "" || v === null ? undefined : v), z.coerce.number().min(0, "Old price must be positive").optional()),
  quantity: z.coerce.number().int().min(0, "Quantity must be non-negative"),
  category_id: z.number().int().positive("Category is required"),
  country_code: z.string().min(1, "Country is required"),
  currency_code: z.string().min(1, "Currency is required"),
  variant_group: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  attributes: ProductAttributesSchema,
  attributes_ar: ProductAttributesSchema.optional(),
  primary_image: z.string().optional(),
  images: z.array(z.string()).optional(),
  meta_title_en: z.string().optional(),
  meta_title_ar: z.string().optional(),
  meta_description_en: z.string().optional(),
  meta_description_ar: z.string().optional(),
  meta_thumbnail: z.string().optional(),
  admin_note: z.string().optional(),
});

export type ProductFormData = z.infer<typeof ProductFormSchema>;

export const AttributeFormSchema = z.object({
  key: z.string().min(1, "Attribute key is required"),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    ProductColorSchema,
    z.array(z.string()),
  ]),
});

export type AttributeFormData = z.infer<typeof AttributeFormSchema>;
