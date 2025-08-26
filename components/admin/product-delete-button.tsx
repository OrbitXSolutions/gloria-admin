"use client";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { deleteProduct } from "@/lib/actions/products";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

interface Props { id: number }

export default function DeleteProductButton({ id }: Props) {
    const { execute, status } = useAction(deleteProduct, {
        onSuccess() { toast.success('Product deleted') },
        onError() { toast.error('Failed to delete product') }
    })
    const pending = status === 'executing'
    const MySwal = withReactContent(Swal)

    async function confirmDelete() {
        const res = await MySwal.fire({
            title: 'Delete product?',
            text: 'This will soft-delete the product. Continue?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626',
            reverseButtons: true,
            allowOutsideClick: !pending,
            allowEscapeKey: !pending,
        })
        if (res.isConfirmed) {
            execute({ id })
        }
    }

    return (
        <Button variant="destructive" disabled={pending} onClick={confirmDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            {pending ? 'Deleting...' : 'Delete'}
        </Button>
    )
}
