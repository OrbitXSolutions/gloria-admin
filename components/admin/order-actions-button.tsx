'use client'

import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { MouseEvent } from 'react'

type Props = {
    href?: string
}

export function OrderActionsButton({ href }: Props) {
    const router = useRouter()

    function handleClick(e: MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        e.stopPropagation()
        if (href) router.push(href)
    }

    return (
        <Button variant='ghost' size='icon' onClick={handleClick}>
            <MoreHorizontal className='h-4 w-4' />
        </Button>
    )
}


