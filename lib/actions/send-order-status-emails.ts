"use server";

import { createEmailTransporter, generateCustomerOrderStatusUpdateHTML, generateAdminOrderStatusUpdateHTML } from "@/lib/email";
import { ContactInfo } from "@/lib/constants/contact-info";
import { OrderWithItems } from "@/lib/types/database.types";

interface SendOrderStatusEmailsParams {
    order: OrderWithItems;
    previousStatus: string;
    newStatus: string;
    customerName: string;
    customerEmail: string;
    adminNote?: string;
    changedBy?: string;
}

export async function sendOrderStatusUpdateEmails({
    order,
    previousStatus,
    newStatus,
    customerName,
    customerEmail,
    adminNote,
    changedBy,
}: SendOrderStatusEmailsParams) {
    try {
        // Validate environment variables
        if (
            !process.env.SMTP_HOST ||
            !process.env.SMTP_USER ||
            !process.env.SMTP_PASSWORD
        ) {
            console.error("Email configuration is missing");
            return { success: false, error: "Email configuration is missing" };
        }

        // Create email transporter
        const transporter = createEmailTransporter();

        // Verify connection
        await transporter.verify();

        // Send customer status update email
        const customerMailOptions = {
            from: process.env.SMTP_USER,
            to: customerEmail,
            subject: `Order Status Update - ${order.code} - ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
            html: generateCustomerOrderStatusUpdateHTML({
                order,
                previousStatus,
                newStatus,
                customerName,
                customerEmail,
                adminNote,
            }),
        };

        // Send admin notification email (optional - for important status changes)
        const shouldSendAdminEmail = ['shipped', 'delivered', 'cancelled', 'failed', 'refunded'].includes(newStatus);

        let adminResult: any = null;

        if (shouldSendAdminEmail) {
            const adminMailOptions = {
                from: process.env.SMTP_USER,
                to: ContactInfo.EMAIL,
                subject: `Order Status Changed - ${order.code} - ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
                html: generateAdminOrderStatusUpdateHTML({
                    order,
                    previousStatus,
                    newStatus,
                    customerName,
                    customerEmail,
                    adminNote,
                    changedBy,
                }),
            };

            adminResult = await transporter.sendMail(adminMailOptions);
        }

        // Send customer email
        const customerResult = await transporter.sendMail(customerMailOptions);

        // Check results
        const customerSuccess = !!customerResult;
        const adminSuccess = !shouldSendAdminEmail || !!adminResult;

        if (customerSuccess && adminSuccess) {
            return {
                success: true,
                message: "Order status update emails sent successfully",
            };
        } else {
            console.error("Email sending results:", { customerResult, adminResult });
            return {
                success: false,
                error: "Some emails failed to send",
                details: {
                    customerEmail: customerSuccess ? 'sent' : 'failed',
                    adminEmail: shouldSendAdminEmail ? (adminSuccess ? 'sent' : 'failed') : 'not sent',
                },
            };
        }
    } catch (error) {
        console.error("Error sending order status update emails:", error);

        // Return a user-friendly error message
        return {
            success: false,
            error: "Failed to send status update emails. Please try again later.",
        };
    }
}

