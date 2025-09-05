import type React from 'react'
import { redirect } from 'next/navigation'
import { createSsrClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { AdminHeader } from '@/components/layout/admin-header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { cookies } from 'next/headers'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const devBypass = process.env.NODE_ENV !== 'production' && cookieStore.get('dev-auth')?.value === '1'

  const supabase = await createSsrClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user && !devBypass) redirect('/login')
  const { data: roleRows } = data.user && !devBypass ? await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', data.user.id)
    .eq('is_deleted', false) : { data: [] as any[] }

  const roles = (roleRows || [])
    .map((r: any) => r?.roles?.name)
    .filter(Boolean) as string[]

  // Treat primary emails as superadmins even if roles table is not yet populated
  if (devBypass) {
    // Force superadmin role in dev bypass so full UI is accessible
    if (!roles.includes('superadmin')) roles.push('superadmin')
  } else {
    const primaryEmails = new Set(['a.rashedy99@gmail.com', 'rowyda.rashedy@gmail.com'])
    const emailIsPrimary = data.user?.email ? primaryEmails.has(data.user.email) : false
    if (emailIsPrimary && !roles.includes('superadmin')) roles.push('superadmin')
  }

  const isSuperAdmin = roles.includes('superadmin')
  const isAdmin = roles.includes('admin')
  const isEditor = roles.includes('editor')
  if (!devBypass && !isSuperAdmin && !isAdmin && !isEditor) redirect('/login')
  return (
    <SidebarProvider>
      <AdminSidebar roles={roles} />
      <SidebarInset>
        <AdminHeader userEmail={data.user?.email || ''} roles={roles} />
        <main className="flex-1 space-y-4 p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
