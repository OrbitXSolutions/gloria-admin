import { z } from "zod";

export const invoiceSchema = z.object({
  code: z.string().min(1, "Invoice code is required"),
  order_code: z.string().optional(),
  user_name: z.string().min(1, "Customer name is required"),
  user_email: z.string().email("Invalid email address"),
  user_phone: z.string().min(1, "Phone number is required"),
  user_address: z.string().min(1, "Address is required"),
  user_notes: z.string().optional(),
  products: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        quantity: z.number().min(1),
        price: z.number().min(0),
        total: z.number().min(0),
      })
    )
    .min(1, "At least one product is required"),
  subtotal: z.number().min(0),
  delivery_fees: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  rate: z.number().min(0).max(1).default(0),
  total_price: z.number().min(0),
  notes: z.string().optional(),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
