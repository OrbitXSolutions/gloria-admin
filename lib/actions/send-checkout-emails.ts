"use server";

import { createEmailTransporter, generateCustomerOrderConfirmationHTML, generateAdminOrderNotificationHTML } from "@/lib/email";
import { ContactInfo } from "@/lib/constants/contact-info";
import { OrderWithItems } from "@/lib/types/database.types";

interface SendCheckoutEmailsParams {
    order: OrderWithItems;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
}

export async function sendCheckoutNotificationEmails({
    order,
    customerName,
    customerEmail,
    customerPhone,
}: SendCheckoutEmailsParams) {
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

        // Send customer confirmation email
        const customerMailOptions = {
            from: process.env.SMTP_USER,
            to: customerEmail,
            subject: `Order Confirmation - ${order.code}`,
            html: generateCustomerOrderConfirmationHTML({
                order,
                customerName,
                customerEmail,
            }),
        };

        // Send admin notification email
        const adminMailOptions = {
            from: process.env.SMTP_USER,
            to: ContactInfo.EMAIL, // Send to support email
            subject: `New Order Received - ${order.code}`,
            html: generateAdminOrderNotificationHTML({
                order,
                customerName,
                customerEmail,
                customerPhone,
            }),
        };

        // Send both emails
        const [customerResult, adminResult] = await Promise.allSettled([
            transporter.sendMail(customerMailOptions),
            transporter.sendMail(adminMailOptions),
        ]);

        // Check if both emails were sent successfully
        const customerSuccess = customerResult.status === 'fulfilled';
        const adminSuccess = adminResult.status === 'fulfilled';

        if (customerSuccess && adminSuccess) {
            return {
                success: true,
                message: "Checkout notification emails sent successfully",
            };
        } else {
            console.error("Email sending results:", { customerResult, adminResult });
            return {
                success: false,
                error: "Some emails failed to send",
                details: {
                    customerEmail: customerSuccess ? 'sent' : 'failed',
                    adminEmail: adminSuccess ? 'sent' : 'failed',
                },
            };
        }
    } catch (error) {
        console.error("Error sending checkout notification emails:", error);

        // Return a user-friendly error message
        return {
            success: false,
            error: "Failed to send notification emails. Please try again later.",
        };
    }
} 