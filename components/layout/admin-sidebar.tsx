"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  Tags,
  FileText,
  Star,
  MapPin,
  CreditCard,
  Globe,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navigation = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        title: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "E-commerce",
    items: [
      {
        title: "Products",
        href: "/admin/products",
        icon: Package,
      },
      {
        title: "Categories",
        href: "/admin/categories",
        icon: Tags,
      },
      {
        title: "Orders",
        href: "/admin/orders",
        icon: ShoppingCart,
      },
      {
        title: "Invoices",
        href: "/admin/invoices",
        icon: FileText,
      },
    ],
  },
  {
    title: "Customer Management",
    items: [
      {
        title: "Users",
        href: "/admin/users",
        icon: Users,
      },
      {
        title: "Reviews",
        href: "/admin/reviews",
        icon: Star,
      },
      {
        title: "Addresses",
        href: "/admin/addresses",
        icon: MapPin,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Countries",
        href: "/admin/countries",
        icon: Globe,
      },
      {
        title: "Currencies",
        href: "/admin/currencies",
        icon: CreditCard,
      },
      {
        title: "Settings",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
]

type AdminSidebarProps = { roles?: string[] }

export function AdminSidebar({ roles = [] }: AdminSidebarProps) {
  const pathname = usePathname()

  const isSuperAdmin = roles.includes('superadmin')
  const isAdmin = roles.includes('admin')
  const isEditor = roles.includes('editor')

  // Filter sections and items based on role
  const filtered = navigation
    .map(section => {
      let items = section.items
      if (isSuperAdmin) return { ...section, items }
      if (isAdmin) {
        // Admin: Overview, E-commerce (4 pages), Customer Management (3 pages); hide System
        if (section.title === 'System') return null
        return { ...section, items }
      }
      if (isEditor) {
        // Editor: only Products and Reviews
        if (section.title === 'E-commerce') {
          items = section.items.filter(i => i.title === 'Products')
        } else if (section.title === 'Customer Management') {
          items = section.items.filter(i => i.title === 'Reviews')
        } else if (section.title === 'Overview' || section.title === 'System') {
          return null
        }
        return { ...section, items }
      }
      return null
    })
    .filter(Boolean) as typeof navigation

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border px-6 py-4">
        <Link href="/admin" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Package className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">Eleva Admin</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {filtered.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
