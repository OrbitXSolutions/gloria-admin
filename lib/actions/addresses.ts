"use server"

import { createSsrClient } from '@/lib/supabase/server'

export async function listAddresses({ page = 1, limit = 20, search }: { page?: number, limit?: number, search?: string }) {
    const supabase = await createSsrClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
        .from('addresses')
        .select(`*, user:users(first_name, last_name, email), state:states(name_en, code, country_code)`, { count: 'exact' })
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

    if (search && search.trim()) {
        const s = `%${search}%`
        query = query.or(`email.ilike.${s},full_name.ilike.${s},phone.ilike.${s},address.ilike.${s},label.ilike.${s}`)
    }

    const { data, count, error } = await query.range(from, to)
    if (error) throw new Error(error.message)
    return { addresses: data ?? [], count: count ?? 0 }
}


