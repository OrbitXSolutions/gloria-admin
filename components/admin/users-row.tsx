"use client"

import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useAction } from 'next-safe-action/hooks'
import { setUserRoles, deleteUser } from '@/lib/actions/users'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash2, Shield } from 'lucide-react'

export function UsersRow({ id, name, email, roles, canManageRoles = false }: { id: string, name: string, email: string, roles: string[], canManageRoles?: boolean }) {
    const { execute, isExecuting } = useAction(setUserRoles)
    const { execute: executeDelete, isExecuting: isDeleting } = useAction(deleteUser)
    const isAdmin = roles.includes('admin')
    function toggleAdmin() {
        const next = isAdmin ? roles.filter(r => r !== 'admin') : [...roles, 'admin']
        execute({ userId: id, roleNames: next })
    }
    return (
        <TableRow>
            <TableCell className="font-medium">{name || '—'}</TableCell>
            <TableCell className="text-muted-foreground">{email}</TableCell>
            <TableCell>
                <div className="flex flex-wrap gap-2">
                    {roles.length ? roles.map(r => <Badge key={r} variant={r === 'admin' ? 'default' : 'secondary'}>{r}</Badge>) : <span className="text-muted-foreground">—</span>}
                </div>
            </TableCell>
            <TableCell className="text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {canManageRoles && (
                            <DropdownMenuItem onClick={toggleAdmin} disabled={isExecuting}>
                                <Shield className="mr-2 h-4 w-4" />
                                {isAdmin ? 'Revoke Admin' : 'Make Admin'}
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {canManageRoles && (
                            <DropdownMenuItem
                                className="text-destructive"
                                disabled={isDeleting}
                                onClick={() => executeDelete({ userId: id })}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    )
}


