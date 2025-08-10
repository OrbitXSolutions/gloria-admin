import { Suspense } from 'react'
import { ReviewsTable } from '@/components/admin/reviews-table'
import { listReviews } from '@/lib/actions/reviews'

async function ReviewsContent() {
    const { reviews } = await listReviews({ page: 1, limit: 50, onlyPending: false })
    return <ReviewsTable reviews={reviews as any} />
}

export default function ReviewsPage() {
    return (
        <div className="space-y-6">
            <Suspense fallback={<p>Loading…</p>}>
                {/* @ts-expect-error Async Server Component */}
                <ReviewsContent />
            </Suspense>
        </div>
    )
}


