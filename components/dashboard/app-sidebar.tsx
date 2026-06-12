"use client";

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
} from "@/components/ui/sidebar";
import {
  Calculator,
  FileText,
  FolderKanban,
  Landmark,
  LayoutDashboard,
  LineChart,
  Percent,
  Plus,
  Receipt,
  Repeat,
  Scale,
  Settings,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations("dashboard.sidebar");
  const tCommon = useTranslations("common");

  const mainNavItems = [
    { title: t("overview"), href: "/dashboard", icon: LayoutDashboard },
    { title: t("projects"), href: "/dashboard/projects", icon: FolderKanban },
    { title: t("recurring"), href: "/dashboard/recurring", icon: Repeat },
    { title: t("accounting"), href: "/dashboard/accounting", icon: Wallet },
  ];

  const accountingNavItems = [
    { title: t("accountingTransactions"), href: "/dashboard/accounting/transactions", icon: Receipt },
    { title: t("accountingContacts"), href: "/dashboard/accounting/contacts", icon: Users },
    { title: t("accountingBanks"), href: "/dashboard/accounting/banks", icon: Landmark },
    { title: t("accountingReports"), href: "/dashboard/accounting/reports", icon: FileText },
  ];

  const analysisNavItems = [
    { title: t("vpn"), href: "/dashboard/vpn", icon: TrendingUp },
    { title: t("tir"), href: "/dashboard/tir", icon: Calculator },
    // { title: t("tmar"), href: "/dashboard/tmar", icon: Percent },
    { title: t("benefitCost"), href: "/dashboard/benefit-cost", icon: Scale },
    { title: t("cashFlow"), href: "/dashboard/cash-flow", icon: LineChart },
  ];

  const otherNavItems = [
    { title: t("reports"), href: "/dashboard/reports", icon: FileText },
    { title: t("settings"), href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border print:hidden">
      <SidebarHeader className="border-b border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <TrendingUp className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">EconoLab</span>
                  <span className="text-xs text-foreground/60">
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
          <SidebarGroupLabel>{t("accountingGroup")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountingNavItems.map((item) => (
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

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t("newProject")}>
              <Link
                href="/dashboard/projects/new"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                <span>{t("newProject")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={t("newRecurring") ?? "New recurring"}
            >
              <Link
                href="/dashboard/recurring/new"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                <Repeat className="h-4 w-4" />
                <span>{t("newRecurring") ?? "New recurring"}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
