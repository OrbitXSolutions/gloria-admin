"use server"

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { createSsrClient } from '@/lib/supabase/server'
import { createSafeActionClient } from 'next-safe-action'
import { cookies } from 'next/headers'

const action = createSafeActionClient()

const loginSchema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password is required')
})

export const login = action
    .inputSchema(loginSchema)
    .action(async ({ parsedInput }) => {
        // Development ONLY bypass for quick access (no Supabase session created).
        if (process.env.NODE_ENV !== 'production' &&
            parsedInput.email === 'rowyda.rashedy@gmail.com' &&
            parsedInput.password === '12345678') {
            const store = await cookies()
            store.set('dev-auth', '1', { httpOnly: true, path: '/' })
            redirect('/admin')
        }

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


