"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

type Address = {
    id: number
    full_name: string | null
    email: string | null
    phone: string | null
    label: string | null
    address: string | null
    is_default: boolean | null
    created_at: string | null
    user?: { first_name: string | null, last_name: string | null, email: string } | null
    state?: { name_en: string | null, code: string, country_code: string } | null
}

export function AddressesTable({ addresses }: { addresses: Address[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Addresses</CardTitle>
                <CardDescription>User shipping addresses</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Label</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>State</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Default</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {addresses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No addresses found.</TableCell>
                                </TableRow>
                            ) : addresses.map(a => (
                                <TableRow key={a.id}>
                                    <TableCell className="font-medium">{`${a.user?.first_name ?? ''} ${a.user?.last_name ?? ''}`.trim() || a.full_name || a.user?.email || '—'}</TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <div>{a.email || '—'}</div>
                                            <div className="text-muted-foreground">{a.phone || '—'}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{a.label || '—'}</TableCell>
                                    <TableCell className="max-w-[520px] truncate" title={a.address ?? ''}>{a.address || '—'}</TableCell>
                                    <TableCell>{a.state?.name_en || a.state?.code || '—'}</TableCell>
                                    <TableCell>{a.created_at ? formatDistanceToNow(new Date(a.created_at), { addSuffix: true }) : '—'}</TableCell>
                                    <TableCell>
                                        {a.is_default ? (
                                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Default</Badge>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}


