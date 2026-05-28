export const routes = {
  home: "/",
  auth: "/auth",
  dashboard: "/dashboard",
  projects: "/dashboard/projects",
  projectsNew: "/dashboard/projects/new",
  projectEdit: (id: string) => `/dashboard/projects/${id}/edit`,
}
