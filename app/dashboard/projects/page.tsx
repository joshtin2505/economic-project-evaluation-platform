"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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
import * as projectService from "@/lib/services/projects"
import { routes } from "@/lib/routes"
import { formatRatePercent } from "@/lib/utils/project-results"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type ProjectStatus = "draft" | "analyzing" | "completed"

interface ProjectResult {
  npv?: number
  irr?: number
}

interface ProjectRow {
  id: string
  name: string
  description: string | null
  initial_investment: number | string
  periods: number
  status: ProjectStatus
  results: ProjectResult | null
  updated_at: string
}

const toNumber = (value: number | string | null | undefined) => Number(value ?? 0)

export default function ProjectsPage() {
  const t = useTranslations("dashboard.projectsPage")
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProjects = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await projectService.fetchProjects()
      setProjects((data ?? []) as ProjectRow[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (projectId: string) => {
    try {
      await projectService.deleteProject(projectId)
      setProjects((current) => current.filter((project) => project.id !== projectId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project")
    }
  }

  useEffect(() => {
    void loadProjects()
  }, [])

  const filteredProjects = useMemo(() => {
    const normalized = search.toLowerCase().trim()
    if (!normalized) return projects

    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(normalized) ||
        (project.description ?? "").toLowerCase().includes(normalized)
      )
    })
  }, [projects, search])

  const completedCount = projects.filter((p) => p.status === "completed").length
  const analyzingCount = projects.filter((p) => p.status === "analyzing").length
  const draftCount = projects.filter((p) => p.status === "draft").length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href={routes.projectsNew}>
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
              <Input
                placeholder={t("searchPlaceholder")}
                className="pl-10"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{t("filters.all", { count: projects.length })}</Badge>
              <Badge variant="outline">{t("filters.completed", { count: completedCount })}</Badge>
              <Badge variant="outline">{t("filters.analyzing", { count: analyzingCount })}</Badge>
              <Badge variant="outline">{t("filters.draft", { count: draftCount })}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="py-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("table.title")}</CardTitle>
          {/* <CardDescription>{t("table.description")}</CardDescription> */}
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading projects...
                  </TableCell>
                </TableRow>
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.id} className="group cursor-pointer hover:bg-muted/50">
                    <TableCell className="max-w-xs">
                      <div>
                        <p className="font-medium">{project.name}</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                        <p className="text-xs text-muted-foreground line-clamp-2 text-ellipsis">
                            {project.description ?? "-"}
                          </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              {project.description ?? "-"}
                            </TooltipContent>
                          </Tooltip>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      ${toNumber(project.initial_investment).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {project.results ? (
                        <div className="flex items-center gap-1">
                          {(project.results.npv ?? 0) >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-success" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          )}
                          <span
                            className={`font-mono ${
                              (project.results.npv ?? 0) >= 0 ? "text-success" : "text-destructive"
                            }`}
                          >
                            ${toNumber(project.results.npv).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.results ? (
                        <span className="font-mono">{formatRatePercent(project.results.irr, 2)}</span>
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
                        {new Date(project.updated_at).toLocaleDateString()}
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
                          <DropdownMenuItem onClick={() => void router.push(routes.projectEdit(project.id))}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t("actions.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => void handleDelete(project.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Project Cards Grid (Alternative View) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
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
                    ${toNumber(project.initial_investment).toLocaleString()}
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
                          (project.results.npv ?? 0) >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        ${toNumber(project.results.npv).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("cards.irr")}</p>
                      <p className="font-mono font-medium">
                        {formatRatePercent(project.results.irr, 2)}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(project.updated_at).toLocaleDateString()}
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
