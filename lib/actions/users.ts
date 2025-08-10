"use server"

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createSsrClient } from '@/lib/supabase/server'
import { createSafeActionClient } from 'next-safe-action'

const action = createSafeActionClient()

export const setUserRoles = action
    .inputSchema(z.object({ userId: z.string(), roleNames: z.array(z.string()) }))
    .action(async ({ parsedInput }) => {
        const supabase = await createSsrClient()
        // Permission: only superadmin can manage roles
        const { data: auth } = await supabase.auth.getUser()
        if (!auth.user) throw new Error('Not authenticated')
        const { data: myRolesRows } = await supabase
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', auth.user.id)
            .eq('is_deleted', false)
        const myRoles = (myRolesRows || []).map((r: any) => r?.roles?.name).filter(Boolean) as string[]
        if (!myRoles.includes('superadmin')) throw new Error('Only superadmin can manage roles')
        const PRIMARY_SUPERADMINS = new Set([
            'a.rashedy99@gmail.com',
            'rowyda.rashedy@gmail.com',
        ])

        // Resolve user email from our users table
        const { data: userRow } = await supabase
            .from('users')
            .select('email')
            .eq('user_id', parsedInput.userId)
            .eq('is_deleted', false)
            .single()

        const email = userRow?.email || null
        if (email && PRIMARY_SUPERADMINS.has(email)) {
            // Ensure primary users always retain superadmin and cannot be changed
            // Idempotently upsert superadmin role
            const { data: roles } = await supabase
                .from('roles')
                .select('id,name')
                .eq('name', 'superadmin')
                .limit(1)
                .maybeSingle()
            if (roles?.id) {
                // Check if user already has active superadmin role
                const { data: existingSuper } = await supabase
                    .from('user_roles')
                    .select('id')
                    .eq('user_id', parsedInput.userId)
                    .eq('role_id', roles.id)
                    .eq('is_deleted', false)
                if (!existingSuper || existingSuper.length === 0) {
                    await supabase.from('user_roles').insert({ user_id: parsedInput.userId, role_id: roles.id, is_deleted: false })
                }
            }
            return { ok: true }
        }
        // Remove existing roles for this user (soft delete where applicable)
        const { data: existing } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', parsedInput.userId)
            .eq('is_deleted', false)

        if (existing && existing.length > 0) {
            await supabase
                .from('user_roles')
                .update({ is_deleted: true, deleted_at: new Date().toISOString() })
                .in('id', existing.map(r => r.id))
        }

        // Fetch role ids for provided names
        const { data: roles } = await supabase
            .from('roles')
            .select('id,name')
            .in('name', parsedInput.roleNames)

        const roleInserts = (roles || []).map(r => ({ user_id: parsedInput.userId, role_id: r.id, is_deleted: false }))
        if (roleInserts.length > 0) {
            await supabase.from('user_roles').insert(roleInserts)
        }

        revalidatePath('/admin/users')
        return { ok: true }
    })

export const deleteUser = action
    .inputSchema(z.object({ userId: z.string() }))
    .action(async ({ parsedInput }) => {
        const supabase = await createSsrClient()
        const { data: auth } = await supabase.auth.getUser()
        if (!auth.user) throw new Error('Not authenticated')

        // Only superadmin can delete users
        const { data: myRolesRows } = await supabase
            .from('user_roles')
            .select('roles(name)')
            .eq('user_id', auth.user.id)
            .eq('is_deleted', false)
        const myRoles = (myRolesRows || []).map((r: any) => r?.roles?.name).filter(Boolean) as string[]
        if (!myRoles.includes('superadmin')) throw new Error('Only superadmin can delete users')

        // Prevent deleting primary superadmins
        const { data: userRow } = await supabase
            .from('users')
            .select('email')
            .eq('user_id', parsedInput.userId)
            .eq('is_deleted', false)
            .maybeSingle()

        const PRIMARY_SUPERADMINS = new Set([
            'a.rashedy99@gmail.com',
            'rowyda.rashedy@gmail.com',
        ])
        if (userRow?.email && PRIMARY_SUPERADMINS.has(userRow.email)) {
            throw new Error('Cannot delete a primary superadmin')
        }

        // Soft delete via RPC if available, else update flag
        const { error: rpcError } = await supabase.rpc('soft_delete_user_record', {
            p_user_id: parsedInput.userId,
            p_deleted_by: auth.user.id,
        })

        if (rpcError) {
            // Fallback to direct update
            await supabase
                .from('users')
                .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: auth.user.id })
                .eq('user_id', parsedInput.userId)
        }

        revalidatePath('/admin/users')
        return { ok: true }
    })

export async function getUsers(page = 1, limit = 10) {
    const supabase = await createSsrClient()
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('is_deleted', false)
        .range(from, to)
        .order('created_at', { ascending: false })
    const users = data ?? []
    // Fetch roles for each user (join on user_id string)
    const userIds = users.map(u => u.user_id).filter(Boolean) as string[]
    let rolesByUserId: Record<string, string[]> = {}
    if (userIds.length) {
        const { data: userRoles } = await supabase
            .from('user_roles')
            .select('user_id, roles(name)')
            .in('user_id', userIds)
            .eq('is_deleted', false)
        for (const row of userRoles || []) {
            const uid = row.user_id as string
            const roleName = (row as any)?.roles?.name as string | undefined
            if (!roleName) continue
            if (!rolesByUserId[uid]) rolesByUserId[uid] = []
            rolesByUserId[uid].push(roleName)
        }
    }
    return { users, count: count ?? 0, rolesByUserId }
}


