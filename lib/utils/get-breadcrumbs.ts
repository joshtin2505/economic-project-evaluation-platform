import {
  Calculator,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LineChart,
  Percent,
  Scale,
  Settings,
  TrendingUp,
} from "lucide-react";

export function getBreadcrumbs(pathname: string, tSidebar: any, tCommon: any) {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [{ title: tCommon("dashboard"), href: "/dashboard" }];

  const mainNavItems = [
    { title: tSidebar("overview"), href: "/dashboard", icon: LayoutDashboard },
    {
      title: tSidebar("projects"),
      href: "/dashboard/projects",
      icon: FolderKanban,
    },
  ];

  const analysisNavItems = [
    { title: tSidebar("vpn"), href: "/dashboard/vpn", icon: TrendingUp },
    { title: tSidebar("tir"), href: "/dashboard/tir", icon: Calculator },
    { title: tSidebar("tmar"), href: "/dashboard/tmar", icon: Percent },
    {
      title: tSidebar("benefitCost"),
      href: "/dashboard/benefit-cost",
      icon: Scale,
    },
    {
      title: tSidebar("cashFlow"),
      href: "/dashboard/cash-flow",
      icon: LineChart,
    },
  ];

  const otherNavItems = [
    { title: tSidebar("reports"), href: "/dashboard/reports", icon: FileText },
    {
      title: tSidebar("settings"),
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  if (segments.length > 1) {
    const allItems = [...mainNavItems, ...analysisNavItems, ...otherNavItems];
    const currentItem = allItems.find((item) => item.href === pathname);
    if (currentItem) {
      breadcrumbs.push({ title: currentItem.title, href: currentItem.href });
    } else if (segments[1] === "projects" && segments[2] === "new") {
      breadcrumbs.push({
        title: tSidebar("projects"),
        href: "/dashboard/projects",
      });
      breadcrumbs.push({
        title: tSidebar("newProject"),
        href: "/dashboard/projects/new",
      });
    } else if (segments[1]) {
      const title =
        segments[1].charAt(0).toUpperCase() +
        segments[1].slice(1).replace(/-/g, " ");
      breadcrumbs.push({ title, href: pathname });
    }
  }

  return breadcrumbs;
}
