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
  accounting: "/dashboard/accounting",
  accountingTransactions: "/dashboard/accounting/transactions",
  accountingContacts: "/dashboard/accounting/contacts",
  accountingInvoices: "/dashboard/accounting/invoices",
  accountingBanks: "/dashboard/accounting/banks",
  accountingReports: "/dashboard/accounting/reports",
  accountingDian: "/dashboard/accounting/dian",
};
