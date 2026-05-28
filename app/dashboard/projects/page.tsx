"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react"
import { mockProjects } from "@/lib/mock-data"

export default function ProjectsPage() {
  const t = useTranslations("dashboard.projectsPage")

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("newProject")}
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={t("searchPlaceholder")} className="pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{t("filters.all", { count: mockProjects.length })}</Badge>
              <Badge variant="outline">
                {t("filters.completed", { count: mockProjects.filter((p) => p.status === "completed").length })}
              </Badge>
              <Badge variant="outline">
                {t("filters.analyzing", { count: mockProjects.filter((p) => p.status === "analyzing").length })}
              </Badge>
              <Badge variant="outline">
                {t("filters.draft", { count: mockProjects.filter((p) => p.status === "draft").length })}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("table.title")}</CardTitle>
          <CardDescription>{t("table.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.name")}</TableHead>
                <TableHead>{t("table.investment")}</TableHead>
                <TableHead>{t("table.npv")}</TableHead>
                <TableHead>{t("table.irr")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead>{t("table.updated")}</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockProjects.map((project) => (
                <TableRow key={project.id} className="group cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {project.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    ${project.initialInvestment.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {project.results ? (
                      <div className="flex items-center gap-1">
                        {project.results.npv >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        <span
                          className={`font-mono ${
                            project.results.npv >= 0 ? "text-success" : "text-destructive"
                          }`}
                        >
                          ${project.results.npv.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {project.results ? (
                      <span className="font-mono">
                        {(project.results.irr * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        project.status === "completed"
                          ? "default"
                          : project.status === "analyzing"
                          ? "secondary"
                          : "outline"
                      }
                      className={
                        project.status === "completed"
                          ? "bg-success/10 text-success hover:bg-success/20"
                          : project.status === "analyzing"
                          ? "bg-warning/10 text-warning hover:bg-warning/20"
                          : ""
                      }
                    >
                      {project.status === "completed" && t("status.completed")}
                      {project.status === "analyzing" && t("status.analyzing")}
                      {project.status === "draft" && t("status.draft")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {project.updatedAt}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          {t("actions.view")}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          {t("actions.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("actions.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Project Cards Grid (Alternative View) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockProjects.map((project) => (
          <Card key={project.id} className="group transition-all hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    project.status === "completed"
                      ? "default"
                      : project.status === "analyzing"
                      ? "secondary"
                      : "outline"
                  }
                  className={
                    project.status === "completed"
                      ? "bg-success/10 text-success"
                      : project.status === "analyzing"
                      ? "bg-warning/10 text-warning"
                      : ""
                  }
                >
                  {project.status === "completed" ? t("status.completed") : project.status === "analyzing" ? t("status.analyzing") : t("status.draft")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t("cards.investment")}</p>
                  <p className="font-mono font-medium">
                    ${project.initialInvestment.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("cards.periods")}</p>
                  <p className="font-medium">{t("cards.years", { count: project.periods })}</p>
                </div>
                {project.results && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("cards.npv")}</p>
                      <p
                        className={`font-mono font-medium ${
                          project.results.npv >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        ${project.results.npv.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("cards.irr")}</p>
                      <p className="font-mono font-medium">
                        {(project.results.irr * 100).toFixed(1)}%
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  Updated {project.updatedAt}
                </p>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/vpn">View Analysis</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
