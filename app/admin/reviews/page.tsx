import { Suspense } from 'react'
import { ReviewsTable } from '@/components/admin/reviews-table'
import { listReviews } from '@/lib/actions/reviews'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Search } from 'lucide-react'

type ReviewsPageProps = {
    searchParams?: Promise<{ page?: string, q?: string, status?: string }>
}

async function ReviewsContent({ searchParams }: ReviewsPageProps) {
    const params = (await searchParams) || {}
    const page = Math.max(parseInt(params.page || '1', 10), 1)
    const q = params.q || ''
    const status = params.status === 'pending' || params.status === 'approved' ? params.status : undefined

    const { reviews, count } = await listReviews({ page, limit: 20, search: q, status })

    const totalPages = Math.max(Math.ceil(count / 20), 1)

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="pt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <form action="/admin/reviews" className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input name="q" defaultValue={q} placeholder="Search reviews…" className="pl-9 w-72" />
                        </div>
                        <Select name="status" defaultValue={status || 'all'}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button type="submit" variant="secondary">Filter</Button>
                    </form>
                </CardContent>
            </Card>

            <ReviewsTable reviews={reviews as any} />

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                    <Pagination>
                        <PaginationContent>
                            {page > 1 && (
                                <PaginationItem>
                                    <PaginationPrevious href={`/admin/reviews?page=${page - 1}&q=${encodeURIComponent(q)}${status ? `&status=${status}` : ''}`} />
                                </PaginationItem>
                            )}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <PaginationItem key={p}>
                                    <PaginationLink href={`/admin/reviews?page=${p}&q=${encodeURIComponent(q)}${status ? `&status=${status}` : ''}`} isActive={p === page}>{p}</PaginationLink>
                                </PaginationItem>
                            ))}
                            {page < totalPages && (
                                <PaginationItem>
                                    <PaginationNext href={`/admin/reviews?page=${page + 1}&q=${encodeURIComponent(q)}${status ? `&status=${status}` : ''}`} />
                                </PaginationItem>
                            )}
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    )
}

export default function ReviewsPage({ searchParams }: ReviewsPageProps) {
    return (
        <div className="space-y-6">
            <Suspense fallback={<p>Loading…</p>}>
                <ReviewsContent searchParams={searchParams} />
            </Suspense>
        </div>
    )
}


