import { NextResponse } from 'next/server'
import { createSsrClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createSsrClient()
    const { data: { user } } = await supabase.auth.getUser()
    return NextResponse.json({ user })
}


