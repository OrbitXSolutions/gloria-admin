"use client"

import { Button } from "@/components/ui/button"
import { Globe, LogOut } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAction } from 'next-safe-action/hooks'
import { logout } from '@/lib/actions/auth'

interface AdminHeaderProps {
  userEmail?: string
  roles?: string[]
}

export function AdminHeader({ userEmail = '', roles = [] }: AdminHeaderProps) {
  const { execute: execLogout, isExecuting } = useAction(logout)
  function onLogout() { execLogout() }
  const primaryRole = roles.includes('superadmin') ? 'Super Admin' : roles.includes('admin') ? 'Admin' : roles.includes('editor') ? 'Editor' : ''
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-[#967673] text-white">
      <div className="flex h-16 items-center gap-4 px-4">
        <SidebarTrigger />

        <div className="flex-1 flex items-center gap-4 md:gap-6">
          {/* <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search products, orders, users..." className="pl-10 bg-muted/50" />
          </div> */}
          <div className="flex flex-col leading-tight">
            <span className="text-sm opacity-90">Welcome</span>
            <span className="font-medium flex items-center gap-2 text-sm">
              {userEmail || 'Visitor'}
              {primaryRole && userEmail && (
                <span className="inline-flex items-center rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white border border-white/30">
                  {primaryRole}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="secondary" className="bg-white/15 hover:bg-white/25 text-white border border-white/20 flex items-center">
            <a href="https://www.eleva-boutique.net/" target="_blank" rel="noopener noreferrer" className="flex items-center">
              <Globe className="mr-1.5 h-4 w-4" />
              <span>Website</span>
            </a>
          </Button>
          <Button size="sm" onClick={onLogout} disabled={isExecuting} className="flex items-center bg-[#7f7863] hover:bg-[#6f6957] text-white disabled:opacity-60 disabled:cursor-not-allowed">
            <LogOut className="mr-1.5 h-4 w-4" />
            <span>{isExecuting ? 'Logging out...' : 'Log Out'}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
