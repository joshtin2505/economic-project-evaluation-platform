export const routes = {
  home: "/",
  auth: "/auth",
  dashboard: "/dashboard",
  projects: "/dashboard/projects",
  projectsNew: "/dashboard/projects/new",
  recurring: "/dashboard/recurring",
  recurringNew: "/dashboard/recurring/new",
  recurringEdit: (kind: "income" | "expense", id: string) =>
    `/dashboard/recurring/${kind}/${id}/edit`,
  projectEdit: (id: string) => `/dashboard/projects/${id}/edit`,
  projectInvestment: (id: string) => `/dashboard/projects/${id}/investment`,
  projectControl: (id: string) => `/dashboard/projects/${id}/control`,
  projectScenarios: (id: string) => `/dashboard/projects/${id}/scenarios`,
  projectFinancing: (id: string) => `/dashboard/projects/${id}/financing`,
  projectAssets: (id: string) => `/dashboard/projects/${id}/assets`,
  projectProForma: (id: string) => `/dashboard/projects/${id}/pro-forma`,
};
