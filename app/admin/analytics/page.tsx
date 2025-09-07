import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AnalyticsPage() {
    return (
        <div className='space-y-6'>
            <div>
                <h1 className='text-3xl font-bold tracking-tight'>Analytics</h1>
                <p className='text-muted-foreground'>Quick links to external analytics dashboards.</p>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
                <Card>
                    <CardHeader>
                        <CardTitle>Google Search Console</CardTitle>
                        <CardDescription>Search performance for glorianaturals.ae</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href={'https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Aglorianaturals.ae'} target='_blank'>
                                Open Search Console
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Microsoft Clarity</CardTitle>
                        <CardDescription>Session recordings and heatmaps</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href={'https://clarity.microsoft.com/projects/view/s9rgl6ez1t/gettingstarted'} target='_blank'>
                                Open Clarity Project
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}


