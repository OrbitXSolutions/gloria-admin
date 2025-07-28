# Order Management Actions

This directory contains server actions for managing orders in the Gloria Naturals admin system.

## Order Status Update System

### Files Created

1. **`send-order-status-emails.ts`** - Handles email notifications for order status changes
2. **`orders.ts`** - Server actions for order management including status updates
3. **Updated `email.ts`** - Added email templates for status update notifications

### Order Statuses

The system supports the following order statuses as defined in the database:

- `draft` - Order is in draft state
- `pending` - Order is pending confirmation
- `confirmed` - Order has been confirmed
- `processing` - Order is being processed
- `shipped` - Order has been shipped
- `delivered` - Order has been delivered
- `cancelled` - Order has been cancelled
- `failed` - Order processing failed
- `refunded` - Order has been refunded
- `returned` - Order has been returned

### Usage Examples

#### Update Order Status with Email Notifications

```typescript
import { updateOrderStatus } from "@/lib/actions/orders";

// Update order status and send email notifications
const result = await updateOrderStatus({
  orderId: 123,
  newStatus: "shipped",
  adminNote: "Order shipped via Express Delivery",
  changedBy: "admin@gloria-naturals.net"
});

if (result.success) {
  console.log(`Order status updated from ${result.previousStatus} to ${result.newStatus}`);
}
```

#### Update Order Details (without email notifications)

```typescript
import { updateOrder } from "@/lib/actions/orders";

// Update order details without triggering email notifications
const result = await updateOrder({
  id: 123,
  admin_note: "Customer requested early delivery",
  total_price: 299.99
});
```

#### Get Order Details

```typescript
import { getOrderById } from "@/lib/actions/orders";

// Get order with all related data
const result = await getOrderById({ id: 123 });

if (result.success) {
  const order = result.data;
  console.log(`Order ${order.code} for ${order.user?.email}`);
}
```

### Email Notifications

The system automatically sends email notifications when order status changes:

1. **Customer Email** - Sent to the customer with status update details
2. **Admin Email** - Sent to admin for important status changes (shipped, delivered, cancelled, failed, refunded)

#### Email Templates

- **Customer Template** (`generateCustomerOrderStatusUpdateHTML`) - Professional status update with order details
- **Admin Template** (`generateAdminOrderStatusUpdateHTML`) - Administrative notification with change details

### Integration with Order History

When updating order status, the system automatically:

1. Updates the order status in the `orders` table
2. Adds an entry to the `order_history` table for tracking
3. Sends email notifications to rgloriant parties
4. Revalidates rgloriant pages for cache updates

### Error Handling

- Email failures don't prevent order status updates
- All database operations are wrapped in proper error handling
- Failed operations throw descriptive error messages

### Environment Variables Required

Make sure these environment variables are set for email functionality:

```env
SMTP_HOST=your-smtp-host
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_PORT=587
```

### Status-Specific Email Content

Each status has customized email content:

- **Pending/Confirmed**: "Your order has been confirmed and is now being processed"
- **Processing**: "Your order is now being processed and prepared for shipping"
- **Shipped**: "Great news! Your order has been shipped and is on its way to you"
- **Delivered**: "Your order has been successfully delivered! Thank you for your purchase"
- **Cancelled**: "Your order has been cancelled. If you have any questions, please contact us"
- **Failed**: "There was an issue processing your order. Please contact us for assistance"
- **Refunded**: "Your order has been refunded. The refund will be processed according to your payment method"
- **Returned**: "Your order has been returned and processed. Thank you for your patience" 