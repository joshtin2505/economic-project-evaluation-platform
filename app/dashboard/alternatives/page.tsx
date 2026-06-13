"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  GitCompare,
  Trash2,
  Eye,
  Info,
  Scale,
  Calendar,
  AlertCircle,
  FileText,
} from "lucide-react"
import * as projectGroupsService from "@/lib/services/project-groups"
import * as projectService from "@/lib/services/projects"

interface ProjectGroup {
  id: string
  name: string
  description: string
  comparison_rate: number | null
  selected_project_id: string | null
  created_at: string
  updated_at: string
}

interface Project {
  id: string
  name: string
  initial_investment: number | string
  discount_rate: number | string
  periods: number
  status: string
  results: {
    npv?: number
    irr?: number
  } | null
}

export default function AlternativesPage() {
  const t = useTranslations("dashboard.sidebar")
  const [groups, setGroups] = useState<ProjectGroup[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form states
  const [groupName, setGroupName] = useState("")
  const [description, setDescription] = useState("")
  const [comparisonRate, setComparisonRate] = useState<number>(12)
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const groupsData = await projectGroupsService.fetchProjectGroups()
      const projectsData = await projectService.fetchProjects()
      setGroups(groupsData || [])
      setProjects((projectsData as unknown as Project[]) || [])
    } catch (err) {
      console.error(err)
      toast.error("Error al cargar los datos.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) {
      toast.error("El nombre del grupo es obligatorio.")
      return
    }
    if (selectedProjectIds.length < 2) {
      toast.error("Debes seleccionar al menos 2 proyectos para comparar alternativas.")
      return
    }

    setIsSubmitLoading(true)
    try {
      await projectGroupsService.createProjectGroup(
        groupName,
        description,
        comparisonRate,
        selectedProjectIds
      )
      toast.success("Grupo de alternativas creado correctamente.")
      setIsDialogOpen(false)
      // Reset form
      setGroupName("")
      setDescription("")
      setComparisonRate(12)
      setSelectedProjectIds([])
      // Reload
      void loadData()
    } catch (err) {
      console.error(err)
      toast.error("Error al crear el grupo de alternativas.")
    } finally {
      setIsSubmitLoading(false)
    }
  }

  const handleDeleteGroup = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el grupo "${name}"?`)) {
      return
    }

    try {
      await projectGroupsService.deleteProjectGroup(id)
      toast.success("Grupo eliminado correctamente.")
      setGroups(current => current.filter(g => g.id !== id))
    } catch (err) {
      console.error(err)
      toast.error("Error al eliminar el grupo.")
    }
  }

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjectIds(current =>
      current.includes(projectId)
        ? current.filter(id => id !== projectId)
        : [...current, projectId]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GitCompare className="h-6 w-6 text-primary" />
            Comparación de Alternativas
          </h1>
          <p className="text-muted-foreground">
            Compara proyectos de inversión mutuamente excluyentes usando tasas homogéneas y análisis incremental.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Grupo de Alternativas</DialogTitle>
              <DialogDescription>
                Agrupa proyectos similares para realizar una evaluación justa bajo las mismas condiciones de descuento.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateGroup} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="groupName">Nombre del Grupo</Label>
                <Input
                  id="groupName"
                  placeholder="Ej: Expansión de Planta vs Tercerización"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupDesc">Descripción</Label>
                <Textarea
                  id="groupDesc"
                  placeholder="Describe el propósito de la comparación de estas alternativas..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compRate" className="flex items-center gap-1">
                  Tasa de Comparación Común (%)
                  <Badge variant="outline" className="text-[10px] py-0.5">Requerido para VPN Homogéneo</Badge>
                </Label>
                <Input
                  id="compRate"
                  type="number"
                  step="0.1"
                  value={comparisonRate}
                  onChange={e => setComparisonRate(Number(e.target.value))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Se utilizará esta tasa para recalcular el VPN de todos los proyectos seleccionados bajo el mismo criterio de costo de oportunidad.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="font-semibold text-sm">Selecciona los Proyectos a Comparar (mínimo 2)</Label>
                
                {projects.length < 2 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-amber-500">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>Necesitas tener al menos 2 proyectos guardados para crear una comparación.</p>
                  </div>
                ) : (
                  <div className="rounded-md border max-h-48 overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-muted/50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Proyecto</TableHead>
                          <TableHead>Inversión</TableHead>
                          <TableHead>VPN Propio</TableHead>
                          <TableHead>TIR Propia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects.map(project => {
                          const isSelected = selectedProjectIds.includes(project.id)
                          return (
                            <TableRow
                              key={project.id}
                              className="cursor-pointer hover:bg-muted/30"
                              onClick={() => handleProjectToggle(project.id)}
                            >
                              <TableCell onClick={e => e.stopPropagation()}>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleProjectToggle(project.id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{project.name}</TableCell>
                              <TableCell className="font-mono text-xs">
                                ${Number(project.initial_investment).toLocaleString()}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {project.results?.npv !== undefined ? (
                                  <span className={project.results.npv >= 0 ? "text-success" : "text-destructive"}>
                                    ${Math.round(project.results.npv).toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {project.results?.irr !== undefined ? (
                                  <span>{(project.results.irr * 100).toFixed(1)}%</span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitLoading || selectedProjectIds.length < 2}>
                  {isSubmitLoading ? "Creando..." : "Crear Comparación"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Grupos de Comparación</span>
              <GitCompare className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold">{groups.length}</span>
              <span className="text-xs text-muted-foreground">activos</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Proyectos Vinculados</span>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {projects.length}
              </span>
              <span className="text-xs text-muted-foreground">disponibles</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Tasa Homogénea Promedio</span>
              <Scale className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {groups.length > 0
                  ? (groups.reduce((acc, g) => acc + (g.comparison_rate || 0), 0) / groups.length).toFixed(1)
                  : "0.0"}
                %
              </span>
              <span className="text-xs text-muted-foreground">TMAR común</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List section */}
      <Card>
        <CardHeader>
          <CardTitle>Grupos de Análisis</CardTitle>
          <CardDescription>
            Listado de estudios de alternativas disponibles para su evaluación económica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Cargando grupos de comparación...
            </div>
          ) : groups.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              <GitCompare className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-lg">No hay grupos de alternativas creados</p>
              <p className="text-sm max-w-md mx-auto mt-1 mb-4">
                Agrupa tus proyectos de inversión para realizar análisis incrementales y determinar qué alternativa es la óptima financieramente.
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Grupo
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Grupo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-40 text-center">Tasa Común (TMAR)</TableHead>
                    <TableHead className="w-40 text-center">Fecha Creación</TableHead>
                    <TableHead className="w-32 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map(group => (
                    <TableRow key={group.id} className="hover:bg-muted/50">
                      <TableCell className="font-semibold">
                        <Link
                          href={`/dashboard/alternatives/${group.id}`}
                          className="hover:underline text-primary flex items-center gap-1.5"
                        >
                          {group.name}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground text-xs">
                        {group.description || <span className="italic">Sin descripción</span>}
                      </TableCell>
                      <TableCell className="text-center font-mono font-medium">
                        {group.comparison_rate !== null ? `${group.comparison_rate}%` : "-"}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        <div className="flex items-center justify-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(group.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/dashboard/alternatives/${group.id}`}>
                              <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
