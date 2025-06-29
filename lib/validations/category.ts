import { z } from "zod";

export const categoryFormSchema = z.object({
  name_en: z.string().min(1, "English name is required"),
  name_ar: z.string().min(1, "Arabic name is required"),
  slug: z.string().min(1, "English slug is required"),
  slug_ar: z.string().min(1, "Arabic slug is required"),
  meta_title_en: z.string().optional(),
  meta_title_ar: z.string().optional(),
  meta_description_en: z.string().optional(),
  meta_description_ar: z.string().optional(),
  image: z.string().optional(),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;

export interface CategoryWithCounts {
  id: number;
  name_en: string | null;
  name_ar: string | null;
  slug: string;
  slug_ar: string;
  image: string | null;
  meta_title_en: string | null;
  meta_title_ar: string | null;
  meta_description_en: string | null;
  meta_description_ar: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_deleted: boolean | null;
  _count?: {
    products: number;
  };
}
