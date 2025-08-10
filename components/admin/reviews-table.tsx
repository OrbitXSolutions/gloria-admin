"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAction } from 'next-safe-action/hooks'
import { approveReview, deleteReview } from '@/lib/actions/reviews'
import { formatDistanceToNow } from 'date-fns'

type Review = {
    id: number
    name: string | null
    comment: string | null
    rating: number | null
    is_approved: boolean | null
    created_at: string | null
    product?: { name_en: string | null } | null
    user?: { first_name: string | null, last_name: string | null, email: string } | null
}

export function ReviewsTable({ reviews }: { reviews: Review[] }) {
    const { execute: runApprove, isExecuting: approving } = useAction(approveReview)
    const { execute: runDelete, isExecuting: deleting } = useAction(deleteReview)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Reviews</CardTitle>
                <CardDescription>Moderate product reviews</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Reviewer</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>Comment</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reviews.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No reviews found.</TableCell>
                                </TableRow>
                            ) : reviews.map(r => (
                                <TableRow key={r.id}>
                                    <TableCell className="font-medium">{r.name || `${r.user?.first_name ?? ''} ${r.user?.last_name ?? ''}`.trim() || r.user?.email || '—'}</TableCell>
                                    <TableCell>{r.product?.name_en || '—'}</TableCell>
                                    <TableCell>{r.rating ?? '—'}</TableCell>
                                    <TableCell className="max-w-[480px] truncate" title={r.comment ?? ''}>{r.comment || '—'}</TableCell>
                                    <TableCell>
                                        {r.is_approved ? (
                                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Approved</Badge>
                                        ) : (
                                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {r.created_at ? formatDistanceToNow(new Date(r.created_at), { addSuffix: true }) : '—'}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {!r.is_approved && (
                                            <Button size="sm" variant="default" disabled={approving} onClick={() => runApprove({ id: r.id })}>Approve</Button>
                                        )}
                                        <Button size="sm" variant="destructive" disabled={deleting} onClick={() => runDelete({ id: r.id })}>Delete</Button>
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


