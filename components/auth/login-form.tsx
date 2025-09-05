"use client"

import { useState, useTransition } from 'react'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAction } from 'next-safe-action/hooks'
import { login } from '@/lib/actions/auth'

const schema = z.object({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password is required')
})

export function LoginForm() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState<string | null>(null)
    const { execute, isExecuting } = useAction(login, {
        onError: ({ error }) => setError(error.serverError || 'Login failed')
    })

    function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        const parsed = schema.safeParse(form)
        if (!parsed.success) {
            setError(parsed.error.errors[0]?.message || 'Invalid input')
            return
        }
        setError(null)
        execute(form)
    }

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
                    placeholder="you@example.com"
                    autoComplete="email"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input
                    type="password"
                    value={form.password}
                    onChange={e => setForm(v => ({ ...v, password: e.target.value }))}
                    placeholder="••••••••"
                    autoComplete="current-password"
                />
            </div>
            {error ? (
                <p className="text-sm text-destructive" role="alert">{error}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isExecuting}>
                {isExecuting ? 'Signing in…' : 'Sign in'}
            </Button>
        </form>
    )
}


