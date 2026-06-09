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
};
