import { z } from "zod"

const ProductColorSchema = z.object({
  hex: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color format"),
  name: z.string().min(1, "Color name is required"),
})

const ProductAttributesSchema = z.record(z.any()).optional()

export const ProductFormSchema = z.object({
  name_en: z.string().min(1, "English name is required"),
  name_ar: z.string().optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  slug: z.string().min(1, "English slug is required"),
  slug_ar: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  price: z.number().min(0, "Price must be positive"),
  old_price: z.number().min(0, "Old price must be positive").optional(),
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
  category_id: z.number().int().positive("Category is required"),
  country_code: z.string().min(1, "Country is required"),
  currency_code: z.string().min(1, "Currency is required"),
  variant_group: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  attributes: ProductAttributesSchema,
  primary_image: z.string().optional(),
  images: z.array(z.string()).optional(),
  meta_title_en: z.string().optional(),
  meta_title_ar: z.string().optional(),
  meta_description_en: z.string().optional(),
  meta_description_ar: z.string().optional(),
  meta_thumbnail: z.string().optional(),
  admin_note: z.string().optional(),
})

export type ProductFormData = z.infer<typeof ProductFormSchema>

export const AttributeFormSchema = z.object({
  key: z.string().min(1, "Attribute key is required"),
  value: z.union([z.string(), z.number(), z.boolean(), ProductColorSchema, z.array(z.string())]),
})

export type AttributeFormData = z.infer<typeof AttributeFormSchema>
