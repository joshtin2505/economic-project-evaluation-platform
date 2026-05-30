"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  LayoutDashboard,
  FolderKanban,
  TrendingUp,
  Calculator,
  Percent,
  Scale,
  LineChart,
  FileText,
  Settings,
  ChevronRight,
  Bell,
  Search,
  Plus,
  LogOut,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"
import { LanguageSwitcher } from "@/components/language-switcher"
import * as auth from "@/lib/supabase/auth"
import * as projectService from "@/lib/services/projects"
import {
  buildNotifications,
  type ProjectRecord,
} from "@/lib/services/project-analytics"

function getBreadcrumbs(pathname: string, tSidebar: any, tCommon: any) {
  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs = [{ title: tCommon("dashboard"), href: "/dashboard" }]

  const mainNavItems = [
    { title: tSidebar("overview"), href: "/dashboard", icon: LayoutDashboard },
    { title: tSidebar("projects"), href: "/dashboard/projects", icon: FolderKanban },
  ]

  const analysisNavItems = [
    { title: tSidebar("vpn"), href: "/dashboard/vpn", icon: TrendingUp },
    { title: tSidebar("tir"), href: "/dashboard/tir", icon: Calculator },
    { title: tSidebar("tmar"), href: "/dashboard/tmar", icon: Percent },
    { title: tSidebar("benefitCost"), href: "/dashboard/benefit-cost", icon: Scale },
    { title: tSidebar("cashFlow"), href: "/dashboard/cash-flow", icon: LineChart },
  ]

  const otherNavItems = [
    { title: tSidebar("reports"), href: "/dashboard/reports", icon: FileText },
    { title: tSidebar("settings"), href: "/dashboard/settings", icon: Settings },
  ]

  if (segments.length > 1) {
    const allItems = [...mainNavItems, ...analysisNavItems, ...otherNavItems]
    const currentItem = allItems.find((item) => item.href === pathname)
    if (currentItem) {
      breadcrumbs.push({ title: currentItem.title, href: currentItem.href })
    } else if (segments[1] === "projects" && segments[2] === "new") {
      breadcrumbs.push({ title: tSidebar("projects"), href: "/dashboard/projects" })
      breadcrumbs.push({ title: tSidebar("newProject"), href: "/dashboard/projects/new" })
    } else if (segments[1]) {
      const title = segments[1].charAt(0).toUpperCase() + segments[1].slice(1).replace(/-/g, " ")
      breadcrumbs.push({ title, href: pathname })
    }
  }

  return breadcrumbs
}

function AppSidebar() {
  const pathname = usePathname()
  const t = useTranslations("dashboard.sidebar")
  const tCommon = useTranslations("common")

  const mainNavItems = [
    { title: t("overview"), href: "/dashboard", icon: LayoutDashboard },
    { title: t("projects"), href: "/dashboard/projects", icon: FolderKanban },
  ]

  const analysisNavItems = [
    { title: t("vpn"), href: "/dashboard/vpn", icon: TrendingUp },
    { title: t("tir"), href: "/dashboard/tir", icon: Calculator },
    { title: t("tmar"), href: "/dashboard/tmar", icon: Percent },
    { title: t("benefitCost"), href: "/dashboard/benefit-cost", icon: Scale },
    { title: t("cashFlow"), href: "/dashboard/cash-flow", icon: LineChart },
  ]

  const otherNavItems = [
    { title: t("reports"), href: "/dashboard/reports", icon: FileText },
    { title: t("settings"), href: "/dashboard/settings", icon: Settings },
  ]

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
                  <TrendingUp className="h-4 w-4 text-sidebar-primary-foreground" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">EconoLab</span>
                  <span className="text-xs text-sidebar-foreground/60">
                    {tCommon("tagline")}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("main")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
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

        <SidebarGroup>
          <SidebarGroupLabel>{t("analysis")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analysisNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
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

        <SidebarGroup>
          <SidebarGroupLabel>{t("configuration")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t("newProject")}>
              <Link href="/dashboard/projects/new" className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
                <Plus className="h-4 w-4" />
                <span>{t("newProject")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function DashboardHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const tSidebar = useTranslations("dashboard.sidebar")
  const tCommon = useTranslations("common")
  const breadcrumbs = getBreadcrumbs(pathname, tSidebar, tCommon)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const projects =
          (await projectService.fetchProjects()) as ProjectRecord[]
        setNotificationCount(buildNotifications(projects).length)
      } catch {
        setNotificationCount(0)
      }
    }

    void loadNotifications()
  }, [pathname])

  const handleSignOut = async () => {
    setIsSigningOut(true)

    try {
      await auth.signOut()
      router.push("/auth")
      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />

      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={crumb.href}>
              {index < breadcrumbs.length - 1 ? (
                <>
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.title}</Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                </>
              ) : (
                <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden lg:block">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={tSidebar("searchPlaceholder")}
            className="h-9 w-64 bg-muted/50 pl-9"
          />
        </div>
        <LanguageSwitcher />
        <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={isSigningOut}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{tCommon("logout")}</span>
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px]">
              {notificationCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
