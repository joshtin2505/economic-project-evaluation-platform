"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
// import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
// import useDashboardNotifications from "@/hooks/use-dashboard-notifications";
import * as auth from "@/lib/supabase/auth";
import { getBreadcrumbs } from "@/lib/utils/get-breadcrumbs";
import { LogOut, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import HeaderProjectFinder from "./header-project-finder";

export default function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const tSidebar = useTranslations("dashboard.sidebar");
  const tCommon = useTranslations("common");
  const breadcrumbs = getBreadcrumbs(pathname, tSidebar, tCommon);

  // const { notificationCount } = useDashboardNotifications();

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await auth.signOut();
      router.push("/auth");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />

      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.href}>
              {index < breadcrumbs.length - 1 ? (
                <>
                  <BreadcrumbItem key={crumb.href}>
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.title}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              ) : (
                <BreadcrumbItem key={crumb.href}>
                  <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        {/* <HeaderProjectFinder /> */}
        <LanguageSwitcher />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{tCommon("logout")}</span>
        </Button>
        {/* <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px]">
              {notificationCount}
            </Badge>
          )}
        </Button> */}
      </div>
    </header>
  );
}
