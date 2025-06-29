"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Calculator } from "lucide-react"
import { invoiceSchema, type InvoiceFormData } from "@/lib/validations/invoice"
import { createInvoice, updateInvoice } from "@/lib/actions/invoices"
import { useAction } from "next-safe-action/hooks"
import { toast } from "sonner"

interface InvoiceFormProps {
  initialData?: Partial<InvoiceFormData> & { id?: string }
  isEditing?: boolean
}

export function InvoiceForm({ initialData, isEditing = false }: InvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      code: initialData?.code || `INV-${Date.now()}`,
      order_code: initialData?.order_code || "",
      user_name: initialData?.user_name || "",
      user_email: initialData?.user_email || "",
      user_phone: initialData?.user_phone || "",
      user_address: initialData?.user_address || "",
      user_notes: initialData?.user_notes || "",
      products: initialData?.products || [{ id: "", name: "", quantity: 1, price: 0, total: 0 }],
      subtotal: initialData?.subtotal || 0,
      delivery_fees: initialData?.delivery_fees || 0,
      discount: initialData?.discount || 0,
      rate: initialData?.rate || 0,
      total_price: initialData?.total_price || 0,
      notes: initialData?.notes || "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
  })

  const { execute: executeCreate } = useAction(createInvoice, {
    onSuccess: () => {
      toast.success("Invoice created successfully")
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Failed to create invoice")
      setIsSubmitting(false)
    },
  })

  const { execute: executeUpdate } = useAction(updateInvoice, {
    onSuccess: () => {
      toast.success("Invoice updated successfully")
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Failed to update invoice")
      setIsSubmitting(false)
    },
  })

  // Calculate totals when products, delivery fees, discount, or rate change
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.startsWith("products") || name === "delivery_fees" || name === "discount" || name === "rate") {
        calculateTotals()
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const calculateTotals = () => {
    const products = form.getValues("products")
    const deliveryFees = form.getValues("delivery_fees") || 0
    const discount = form.getValues("discount") || 0
    const rate = form.getValues("rate") || 0

    // Calculate product totals
    const updatedProducts = products.map((product) => ({
      ...product,
      total: (product.quantity || 0) * (product.price || 0),
    }))

    // Update products with calculated totals
    form.setValue("products", updatedProducts)

    // Calculate subtotal
    const subtotal = updatedProducts.reduce((sum, product) => sum + product.total, 0)
    form.setValue("subtotal", subtotal)

    // Calculate total price
    const afterDiscount = subtotal - discount
    const tax = afterDiscount * rate
    const totalPrice = afterDiscount + deliveryFees + tax
    form.setValue("total_price", Math.max(0, totalPrice))
  }

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSubmitting(true)

    if (isEditing && initialData?.id) {
      executeUpdate({ id: initialData.id, data })
    } else {
      executeCreate(data)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>Basic invoice information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Code</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="order_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Code (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Subtotal:</span>
                <span className="font-medium">${form.watch("subtotal")?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Delivery:</span>
                <span className="font-medium">${form.watch("delivery_fees")?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Discount:</span>
                <span className="font-medium text-green-600">-${form.watch("discount")?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Tax ({((form.watch("rate") || 0) * 100).toFixed(1)}%):
                </span>
                <span className="font-medium">
                  $
                  {(
                    ((form.watch("subtotal") || 0) - (form.watch("discount") || 0)) *
                    (form.watch("rate") || 0)
                  ).toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${form.watch("total_price")?.toFixed(2) || "0.00"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Customer details and billing information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="user_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="user_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="user_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="user_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="user_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Products</CardTitle>
                <CardDescription>Add products to this invoice</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ id: "", name: "", quantity: 1, price: 0, total: 0 })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                <FormField
                  control={form.control}
                  name={`products.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`products.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`products.${index}.price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <div className="w-full">
                    <FormLabel>Total</FormLabel>
                    <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                      <span className="text-sm font-medium">
                        $
                        {(
                          (form.watch(`products.${index}.quantity`) || 0) * (form.watch(`products.${index}.price`) || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pricing Details */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Details</CardTitle>
            <CardDescription>Delivery fees, discounts, and tax information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="delivery_fees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Fees</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
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
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
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
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate (0-1)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>Any additional information for this invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Invoice" : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
