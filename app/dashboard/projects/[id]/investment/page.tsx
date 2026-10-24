"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Layers, FolderKanban } from "lucide-react";
import * as projectService from "@/lib/services/projects";
import * as disbursementService from "@/lib/services/disbursements";
import DisbursementSchedule from "@/components/dashboard/DisbursementSchedule";
import { routes } from "@/lib/routes";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProjectInvestmentPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [disbursements, setDisbursements] = useState<disbursementService.InvestmentDisbursement[]>([]);
  const [progress, setProgress] = useState<disbursementService.ExecutionProgressSummary>({
    totalPlanned: 0,
    totalActual: 0,
    disbursedAmount: 0,
    committedAmount: 0,
    pendingAmount: 0,
    progressPercent: 0,
    varianceAmount: 0,
    variancePercent: 0,
  });
  const [categories, setCategories] = useState<disbursementService.CategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projData, disbData, progData, catData] = await Promise.all([
        projectService.fetchProjectById(id),
        disbursementService.fetchDisbursementsByProject(id),
        disbursementService.getExecutionProgress(id),
        disbursementService.getDisbursementsByCategory(id),
      ]);

      if (!projData) {
        throw new Error("Proyecto no encontrado.");
      }

      setProject(projData);
      setDisbursements(disbData);
      setProgress(progData);
      setCategories(catData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar la información del cronograma.");
      toast.error("Error al cargar datos del proyecto.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando cronograma de inversión...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
        <p className="text-base text-destructive font-medium">{error || "Proyecto no disponible."}</p>
        <Button variant="outline" asChild>
          <Link href={routes.projects}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Proyectos
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header con navegación y detalles del proyecto */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href={routes.projects}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <FolderKanban className="h-3.5 w-3.5" />
              Proyectos
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {project.name}
            </span>
            <span>/</span>
            <span className="text-foreground font-medium">Inversión & CAPEX</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {project.name}
            </h1>
            <Badge variant="outline" className="text-xs capitalize">
              Fase: {project.phase || "Inversión"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            {project.description || "Cronograma de desembolsos, partidas presupuestarias y seguimiento de ejecución de capital."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.projectEdit(id)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Proyecto
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.projects}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
        </div>
      </div>

      {/* Componente interactivo de cronograma de desembolsos */}
      <DisbursementSchedule
        projectId={id}
        projectName={project.name}
        disbursements={disbursements}
        progress={progress}
        categories={categories}
        onRefresh={loadData}
      />
    </div>
  );
}
