"use client";

import { useCallback, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Plus, Trash2, Calculator } from "lucide-react";

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
import { invoiceSchema, type InvoiceFormData } from "@/lib/validations/invoice";
import { createInvoice, updateInvoice } from "@/lib/actions/invoices";

interface InvoiceFormProps {
  initialData?: Partial<InvoiceFormData> & { id?: number };
  isEditing?: boolean;
}

export function InvoiceForm({
  initialData,
  isEditing = false,
}: InvoiceFormProps) {
  return <></>;
}
