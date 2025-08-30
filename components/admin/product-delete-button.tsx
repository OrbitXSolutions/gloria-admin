"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/lib/actions/products";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface Props { id: number }

export default function DeleteProductButton({ id }: Props) {
    const [open, setOpen] = useState(false)
    const { execute, status } = useAction(deleteProduct, {
        onSuccess() { toast.success('Product deleted'); setOpen(false) },
        onError() { toast.error('Failed to delete product') }
    })
    const pending = status === 'executing'

    const onConfirm = () => { if (!pending) execute({ id }) }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={pending}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {pending ? 'Deleting...' : 'Delete'}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete product?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will soft-delete the product. You can restore it later from the database if needed.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} disabled={pending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {pending ? 'Deleting...' : 'Yes, delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
