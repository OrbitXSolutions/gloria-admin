import { Suspense } from 'react'
import { listAddresses } from '@/lib/actions/addresses'
import { AddressesTable } from '@/components/admin/addresses-table'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'

type PageProps = {
    searchParams?: Promise<{ page?: string, q?: string }>
}

async function AddressesContent({ searchParams }: PageProps) {
    const params = (await searchParams) || {}
    const page = Math.max(parseInt(params.page || '1', 10), 1)
    const q = params.q || ''
    const { addresses, count } = await listAddresses({ page, limit: 20, search: q })
    const totalPages = Math.max(Math.ceil(count / 20), 1)

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="pt-6">
                    <form action="/admin/addresses" className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input name="q" defaultValue={q} placeholder="Search addresses…" className="pl-9 w-80" />
                        </div>
                        <Button type="submit" variant="secondary">Search</Button>
                    </form>
                </CardContent>
            </Card>

            <AddressesTable addresses={addresses as any} />

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                    <Pagination>
                        <PaginationContent>
                            {page > 1 && (
                                <PaginationItem>
                                    <PaginationPrevious href={`/admin/addresses?page=${page - 1}&q=${encodeURIComponent(q)}`} />
                                </PaginationItem>
                            )}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <PaginationItem key={p}>
                                    <PaginationLink href={`/admin/addresses?page=${p}&q=${encodeURIComponent(q)}`} isActive={p === page}>{p}</PaginationLink>
                                </PaginationItem>
                            ))}
                            {page < totalPages && (
                                <PaginationItem>
                                    <PaginationNext href={`/admin/addresses?page=${page + 1}&q=${encodeURIComponent(q)}`} />
                                </PaginationItem>
                            )}
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    )
}

export default function AddressesPage({ searchParams }: PageProps) {
    return (
        <div className="space-y-6">
            <Suspense fallback={<p>Loading…</p>}>
                {/* @ts-expect-error Async Server Component */}
                <AddressesContent searchParams={searchParams} />
            </Suspense>
        </div>
    )
}


