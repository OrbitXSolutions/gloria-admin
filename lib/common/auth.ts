import { createSsrClient } from '@/lib/supabase/server'

export async function requireAdmin() {
    const supabase = await createSsrClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false as const, reason: 'unauthenticated' as const }
    const role = (user.app_metadata as any)?.role
    if (role !== 'admin') return { ok: false as const, reason: 'unauthorized' as const }
    return { ok: true as const, user }
}


