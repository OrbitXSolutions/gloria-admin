"use server"

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createSsrClient } from '@/lib/supabase/server'
import { createSafeActionClient } from 'next-safe-action'

const action = createSafeActionClient()

const loginSchema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password is required')
})

export const login = action
    .inputSchema(loginSchema)
    .action(async ({ parsedInput }) => {
        const supabase = await createSsrClient()
        const { error } = await supabase.auth.signInWithPassword({
            email: parsedInput.email,
            password: parsedInput.password
        })
        if (error) throw new Error(error.message)
        redirect('/admin')
    })

export const logout = action.action(async () => {
    const supabase = await createSsrClient()
    await supabase.auth.signOut()
    redirect('/login')
})


