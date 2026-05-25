"use client"

import Link from "next/link"
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
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage and analyze your economic evaluation projects
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search projects..." className="pl-10" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">All ({mockProjects.length})</Badge>
              <Badge variant="outline">
                Completed ({mockProjects.filter((p) => p.status === "completed").length})
              </Badge>
              <Badge variant="outline">
                Analyzing ({mockProjects.filter((p) => p.status === "analyzing").length})
              </Badge>
              <Badge variant="outline">
                Draft ({mockProjects.filter((p) => p.status === "draft").length})
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            Click on a project to view detailed analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Investment</TableHead>
                <TableHead>NPV</TableHead>
                <TableHead>IRR</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
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
                      {project.status === "completed" && "Completed"}
                      {project.status === "analyzing" && "Analyzing"}
                      {project.status === "draft" && "Draft"}
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
                          View Analysis
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Investment</p>
                  <p className="font-mono font-medium">
                    ${project.initialInvestment.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Periods</p>
                  <p className="font-medium">{project.periods} years</p>
                </div>
                {project.results && (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">NPV</p>
                      <p
                        className={`font-mono font-medium ${
                          project.results.npv >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        ${project.results.npv.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">IRR</p>
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
