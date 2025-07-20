"use client";

import * as React from "react";
import { format } from "date-fns";
import { ArrowLeft, Package, User, MapPin, CreditCard, FileText, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProductImageUrl } from "@/lib/constants/supabase-storage";
import Link from "next/link";
import type { OrderWithItems } from "@/lib/types/database.types";

interface OrderDetailsProps {
    order: OrderWithItems;
}

const statusConfig = {
    draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: FileText },
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
    processing: { label: "Processing", color: "bg-purple-100 text-purple-800", icon: Package },
    shipped: { label: "Shipped", color: "bg-indigo-100 text-indigo-800", icon: Package },
    delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
    failed: { label: "Failed", color: "bg-red-100 text-red-800", icon: XCircle },
    refunded: { label: "Refunded", color: "bg-orange-100 text-orange-800", icon: AlertCircle },
    returned: { label: "Returned", color: "bg-red-100 text-red-800", icon: XCircle },
};

const paymentMethodConfig = {
    cash: { label: "Cash on Delivery", icon: CreditCard },
    card: { label: "Credit Card", icon: CreditCard },
};

export function OrderDetails({ order }: OrderDetailsProps) {
    const currentStatus = order.status || "draft";
    const statusInfo = statusConfig[currentStatus as keyof typeof statusConfig];
    const paymentInfo = order.payment_method ? paymentMethodConfig[order.payment_method] : null;

    const formatCurrency = (amount: number | null) => {
        if (amount === null) return "N/A";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD", // You might want to get this from the order's currency
        }).format(amount);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        return format(new Date(dateString), "PPP 'at' p");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/admin/orders">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Orders
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Order #{order.code}
                        </h1>
                        <p className="text-muted-foreground">
                            Created on {formatDate(order.created_at)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={statusInfo.color}>
                        {statusInfo.icon && <statusInfo.icon className="mr-1 h-3 w-3" />}
                        {statusInfo.label}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Order Summary */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                        <CardDescription>
                            Order details and items
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Order Items */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Items</h3>
                            {order.order_items && order.order_items.length > 0 ? (
                                <div className="space-y-4">
                                    {order.order_items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                            <Avatar className="h-16 w-16">
                                                <AvatarImage
                                                    src={item.product?.primary_image ? getProductImageUrl(item.product.primary_image) : undefined}
                                                    alt={item.product?.name_en || "Product"}
                                                />
                                                <AvatarFallback>
                                                    {item.product?.name_en?.charAt(0) || "P"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium truncate">
                                                    {item.product?.name_en || "Unknown Product"}
                                                </h4>
                                                <p className="text-sm text-muted-foreground">
                                                    SKU: {item.product?.sku || "N/A"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Quantity: {item.quantity || 0}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">
                                                    {formatCurrency(item.price)}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Total: {formatCurrency((item.price || 0) * (item.quantity || 0))}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No items found</p>
                            )}
                        </div>

                        <Separator />

                        {/* Order Notes */}
                        {(order.user_note || order.admin_note) && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Notes</h3>
                                {order.user_note && (
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <h4 className="font-medium text-blue-900 mb-2">Customer Note</h4>
                                        <p className="text-blue-800">{order.user_note}</p>
                                    </div>
                                )}
                                {order.admin_note && (
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <h4 className="font-medium text-gray-900 mb-2">Admin Note</h4>
                                        <p className="text-gray-800">{order.admin_note}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Order History */}
                        {order.order_history && order.order_history.length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Status History</h3>
                                    <div className="space-y-3">
                                        {order.order_history
                                            .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
                                            .map((history) => {
                                                const historyStatusInfo = statusConfig[history.status];
                                                return (
                                                    <div key={history.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                                        <div className={`p-2 rounded-full ${historyStatusInfo.color}`}>
                                                            <historyStatusInfo.icon className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-medium">{historyStatusInfo.label}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {formatDate(history.changed_at)}
                                                            </p>
                                                            {history.note && (
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    Note: {history.note}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Customer Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {order.user ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={order.user.avatar || undefined} alt={order.user.first_name || "User"} />
                                            <AvatarFallback>
                                                {order.user.first_name?.charAt(0) || order.user.email?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">
                                                {order.user.first_name && order.user.last_name
                                                    ? `${order.user.first_name} ${order.user.last_name}`
                                                    : order.user.email}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{order.user.email}</p>
                                        </div>
                                    </div>
                                    {order.user.phone && (
                                        <p className="text-sm">
                                            <span className="font-medium">Phone:</span> {order.user.phone}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Customer information not available</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Shipping Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {order.address ? (
                                <div className="space-y-2">
                                    <p className="font-medium">{order.address.full_name}</p>
                                    <p className="text-sm">{order.address.address}</p>
                                    {order.address.phone && (
                                        <p className="text-sm">Phone: {order.address.phone}</p>
                                    )}
                                    {order.address.email && (
                                        <p className="text-sm">Email: {order.address.email}</p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Address not available</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Payment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {paymentInfo ? (
                                <div className="flex items-center gap-2">
                                    <paymentInfo.icon className="h-4 w-4" />
                                    <span>{paymentInfo.label}</span>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Payment method not specified</p>
                            )}

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(order.total_price)}</span>
                                </div>
                                {order.invoice && (
                                    <>
                                        {order.invoice.delivery_fees && (
                                            <div className="flex justify-between">
                                                <span>Delivery Fees:</span>
                                                <span>{formatCurrency(order.invoice.delivery_fees)}</span>
                                            </div>
                                        )}
                                        {order.invoice.discount && (
                                            <div className="flex justify-between">
                                                <span>Discount:</span>
                                                <span>-{formatCurrency(order.invoice.discount)}</span>
                                            </div>
                                        )}
                                        <Separator />
                                        <div className="flex justify-between font-medium">
                                            <span>Total:</span>
                                            <span>{formatCurrency(order.invoice.total_price)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invoice Information */}
                    {order.invoice && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Invoice
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-sm">
                                        <span className="font-medium">Invoice Code:</span> {order.invoice.code}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-medium">Created:</span> {formatDate(order.invoice.created_at)}
                                    </p>
                                    {order.invoice.notes && (
                                        <p className="text-sm">
                                            <span className="font-medium">Notes:</span> {order.invoice.notes}
                                        </p>
                                    )}
                                </div>
                                <Button variant="outline" className="w-full" asChild>
                                    <Link href={`/admin/invoices/${order.invoice.id}`}>
                                        View Invoice
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
} 