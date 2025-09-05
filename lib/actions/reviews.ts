"use server"

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createSsrClient } from '@/lib/supabase/server'
import { actionClient } from '@/lib/common/safe-action'

export async function listReviews({ page = 1, limit = 20, search, status }: { page?: number, limit?: number, search?: string, status?: 'pending' | 'approved' }) {
    const supabase = await createSsrClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
        .from('reviews')
        .select(
            `*, product:products(name_en), user:users(first_name, last_name, email)`,
            { count: 'exact' }
        )
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

    if (status === 'pending') query = query.eq('is_approved', false)
    if (status === 'approved') query = query.eq('is_approved', true)
    if (search && search.trim()) {
        const s = `%${search}%`
        query = query.or(
            `comment.ilike.${s},name.ilike.${s},user.email.ilike.${s},product.name_en.ilike.${s}`
        )
    }

    const { data, count, error } = await query.range(from, to)
    if (error) throw new Error(error.message)
    return { reviews: data ?? [], count: count ?? 0 }
}

export const approveReview = actionClient
    .inputSchema(z.object({ id: z.number(), approvedBy: z.string().optional() }))
    .action(async ({ parsedInput }) => {
        const supabase = await createSsrClient()
        // permission: superadmin, admin, editor
        const { data: auth } = await supabase.auth.getUser()
        if (!auth.user) throw new Error('Not authenticated')
        const { data: myRolesRows } = await supabase
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', auth.user.id)
            .eq('is_deleted', false)
        const myRoles = (myRolesRows || []).map((r: any) => r?.roles?.name).filter(Boolean) as string[]
        if (!myRoles.some(r => ['superadmin', 'admin', 'editor'].includes(r))) {
            throw new Error('Insufficient permissions')
        }
        const { id, approvedBy } = parsedInput
        const { error } = await supabase
            .from('reviews')
            .update({ is_approved: true, updated_at: new Date().toISOString(), updated_by: approvedBy || null })
            .eq('id', id)
            .eq('is_deleted', false)
        if (error) throw new Error(error.message)
        revalidatePath('/admin/reviews')
        return { ok: true }
    })

export const deleteReview = actionClient
    .inputSchema(z.object({ id: z.number(), deletedBy: z.string().optional() }))
    .action(async ({ parsedInput }) => {
        const supabase = await createSsrClient()
        // permission: superadmin, admin
        const { data: auth } = await supabase.auth.getUser()
        if (!auth.user) throw new Error('Not authenticated')
        const { data: myRolesRows } = await supabase
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', auth.user.id)
            .eq('is_deleted', false)
        const myRoles = (myRolesRows || []).map((r: any) => r?.roles?.name).filter(Boolean) as string[]
        if (!myRoles.some(r => ['superadmin', 'admin'].includes(r))) {
            throw new Error('Insufficient permissions')
        }
        const { id, deletedBy } = parsedInput
        const { error } = await supabase
            .from('reviews')
            .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: deletedBy || null })
            .eq('id', id)
        if (error) throw new Error(error.message)
        revalidatePath('/admin/reviews')
        return { ok: true }
    })


