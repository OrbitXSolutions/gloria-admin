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
import { MoreHorizontal, Trash2, Shield, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAllRoles } from '@/lib/actions/users'

export function UsersRow({ id, name, email, roles, canManageRoles = false }: { id: string, name: string, email: string, roles: string[], canManageRoles?: boolean }) {
    const { execute, isExecuting } = useAction(setUserRoles)
    const { execute: executeDelete, isExecuting: isDeleting } = useAction(deleteUser)
    const isAdmin = roles.includes('admin')
    const isEditor = roles.includes('editor')
    const isSuperAdmin = roles.includes('superadmin')
    const [availableRoles, setAvailableRoles] = useState<string[]>([])
    const PRIMARY_SUPERADMINS = new Set(['a.rashedy99@gmail.com', 'rowyda.rashedy@gmail.com'])
    const isPrimary = PRIMARY_SUPERADMINS.has(email)

    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const r = await getAllRoles()
                    if (mounted) setAvailableRoles(r)
                } catch {
                    // ignore
                }
            })()
        return () => { mounted = false }
    }, [])

    function updateRoles(next: string[]) {
        if (isPrimary && !next.includes('superadmin')) {
            // Keep superadmin for primary accounts
            next = Array.from(new Set([...next, 'superadmin']))
        }
        execute({ userId: id, roleNames: next })
    }

    function toggleRole(role: 'admin' | 'editor' | 'superadmin') {
        if (isPrimary) return // immutable from UI
        const has = roles.includes(role)
        const next = has ? roles.filter(r => r !== role) : [...roles, role]
        updateRoles(next)
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
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title={canManageRoles ? 'Open actions' : 'No actions available'}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {canManageRoles ? (
                            <>
                                {availableRoles.map(roleName => (
                                    <DropdownMenuItem key={roleName} onClick={() => toggleRole(roleName as 'admin' | 'editor' | 'superadmin')} disabled={isExecuting || isPrimary}>
                                        <Shield className="mr-2 h-4 w-4" />
                                        {roleName}
                                        {roles.includes(roleName) && <Check className="ml-auto h-4 w-4" />}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive"
                                    disabled={isDeleting || isPrimary}
                                    onClick={() => executeDelete({ userId: id })}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete User
                                </DropdownMenuItem>
                            </>
                        ) : (
                            <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    )
}


