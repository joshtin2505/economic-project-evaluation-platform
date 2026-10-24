"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  ArrowLeft,
  FolderKanban,
  Sliders,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  ShieldAlert,
  Zap,
  Target,
  Layers,
  Activity,
} from "lucide-react";
import * as scenariosService from "@/lib/services/scenarios";
import * as sensitivityEngine from "@/lib/engines/sensitivity-engine";
import { fetchCashFlows, fetchProjectById } from "@/lib/services/projects";
import type { FinancialCashFlow } from "@/lib/engines/financial-engine";
import { routes } from "@/lib/routes";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProjectScenariosPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [data, setData] = useState<scenariosService.ProjectScenariosAnalysis | null>(null);
  const [tornadoData, setTornadoData] = useState<sensitivityEngine.TornadoVariableResult[]>([]);
  const [heatmapData, setHeatmapData] = useState<sensitivityEngine.TwoDimensionalMatrixResult | null>(null);
  const [breakevenPoints, setBreakevenPoints] = useState<sensitivityEngine.BreakevenAnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal para crear / editar escenario
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingScenario, setEditingScenario] = useState<scenariosService.ScenarioRecord | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "custom" as scenariosService.ScenarioRecord["type"],
    description: "",
    probability: 20,
    discountRate: 12,
    inflowVariationPct: 0,
    outflowVariationPct: 0,
    investmentVariationPct: 0,
  });

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [scenariosAnalysis, project, rawFlows] = await Promise.all([
        scenariosService.analyzeProjectScenarios(id),
        fetchProjectById(id),
        fetchCashFlows(id),
      ]);

      setData(scenariosAnalysis);

      const baseFlows: FinancialCashFlow[] = (rawFlows || []).map((f: any) => ({
        period: Number(f.period),
        inflow: Number(f.inflow || 0),
        outflow: Number(f.outflow || 0),
      }));

      const baseInv = Number(project?.initial_investment || 0);
      const baseRate = (Number(project?.discount_rate) || 12) / 100;

      // Calcular análisis de sensibilidad unidimensional (Tornado)
      const tornado = sensitivityEngine.runOneDimensionalSensitivity(
        baseInv,
        baseFlows,
        baseRate,
        20,
      );
      setTornadoData(tornado);

      // Calcular matriz bidimensional (Heatmap)
      const matrix = sensitivityEngine.runTwoDimensionalSensitivity(
        baseInv,
        baseFlows,
        baseRate * 100,
      );
      setHeatmapData(matrix);

      // Calcular Puntos de Equilibrio
      const beRate = sensitivityEngine.findBreakevenPoint(baseInv, baseFlows, baseRate, "discount_rate");
      const beInv = sensitivityEngine.findBreakevenPoint(baseInv, baseFlows, baseRate, "initial_investment");
      const beInflow = sensitivityEngine.findBreakevenPoint(baseInv, baseFlows, baseRate, "inflow_multiplier");
      setBreakevenPoints([beRate, beInv, beInflow]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar escenarios y sensibilidad.");
      toast.error("Error al cargar datos del proyecto.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

  const openCreateDialog = () => {
    setEditingScenario(null);
    setFormData({
      name: "",
      type: "custom",
      description: "",
      probability: 20,
      discountRate: data?.baseDiscountRate || 12,
      inflowVariationPct: 0,
      outflowVariationPct: 0,
      investmentVariationPct: 0,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (scenario: scenariosService.ScenarioRecord) => {
    setEditingScenario(scenario);
    setFormData({
      name: scenario.name,
      type: scenario.type,
      description: scenario.description || "",
      probability: Number(scenario.probability),
      discountRate: scenario.parameters?.discountRate || data?.baseDiscountRate || 12,
      inflowVariationPct: scenario.parameters?.inflowVariationPct || 0,
      outflowVariationPct: scenario.parameters?.outflowVariationPct || 0,
      investmentVariationPct: scenario.parameters?.investmentVariationPct || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingScenario) {
        await scenariosService.updateScenario(editingScenario.id, {
          name: formData.name,
          type: formData.type,
          description: formData.description,
          probability: Number(formData.probability),
          parameters: {
            discountRate: Number(formData.discountRate),
            inflowVariationPct: Number(formData.inflowVariationPct),
            outflowVariationPct: Number(formData.outflowVariationPct),
            investmentVariationPct: Number(formData.investmentVariationPct),
          },
        });
        toast.success("Escenario actualizado exitosamente.");
      } else {
        await scenariosService.createScenario({
          project_id: id,
          name: formData.name,
          type: formData.type,
          description: formData.description,
          probability: Number(formData.probability),
          parameters: {
            discountRate: Number(formData.discountRate),
            inflowVariationPct: Number(formData.inflowVariationPct),
            outflowVariationPct: Number(formData.outflowVariationPct),
            investmentVariationPct: Number(formData.investmentVariationPct),
          },
        });
        toast.success("Escenario creado exitosamente.");
      }
      setIsDialogOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al procesar el escenario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (scenarioId: string) => {
    if (!confirm("¿Deseas eliminar este escenario de análisis?")) return;
    try {
      await scenariosService.deleteScenario(scenarioId);
      toast.success("Escenario eliminado.");
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast.error("Error al eliminar el escenario.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando modelos de escenarios y sensibilidad...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
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

  // Preparar datos para el gráfico Tornado
  const tornadoChartData = tornadoData.map((t) => ({
    name: t.variableLabel,
    swing: t.swing,
    lowNpv: t.lowNpv,
    highNpv: t.highNpv,
    baseNpv: t.baseNpv,
  }));

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* 1. Header */}
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
              {data.projectName}
            </span>
            <span>/</span>
            <span className="text-foreground font-medium">Escenarios & Sensibilidad</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Escenarios y Análisis de Sensibilidad
            </h1>
            <Badge variant="outline" className="text-xs">
              <Sliders className="w-3 h-3 mr-1 text-primary" />
              Análisis Multi-Criterio
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Simulación estocástica de escenarios (Optimista/Pesimista), variables críticas en gráfico Tornado y matriz de sensibilidad bidimensional.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={openCreateDialog} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Escenario
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.projectControl(id)}>
              <Activity className="mr-2 h-4 w-4" />
              Control Real vs Proyectado
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Tarjetas de Resumen de Riesgo Probabilístico */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              VPN Esperado E[VPN]
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.riskSummary.expectedNpv >= 0 ? "text-emerald-600" : "text-destructive"
              }`}
            >
              ${data.riskSummary.expectedNpv.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ponderado según probabilidades asignadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Desviación Estándar (&sigma;)
            </CardTitle>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.riskSummary.standardDeviation.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dispersión de los posibles resultados
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Coeficiente de Variación (CV)
            </CardTitle>
            <Zap className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.riskSummary.coefficientOfVariation}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Riesgo por unidad de rendimiento (&sigma; / |&mu;|)
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nivel de Riesgo del Proyecto
            </CardTitle>
            <AlertTriangle
              className={`w-4 h-4 ${
                data.riskSummary.riskLevel === "Alto"
                  ? "text-destructive"
                  : data.riskSummary.riskLevel === "Moderado"
                  ? "text-amber-500"
                  : "text-emerald-500"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge
                variant={
                  data.riskSummary.riskLevel === "Alto"
                    ? "destructive"
                    : data.riskSummary.riskLevel === "Moderado"
                    ? "secondary"
                    : "default"
                }
                className={
                  data.riskSummary.riskLevel === "Bajo"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 text-sm"
                    : "text-sm"
                }
              >
                Riesgo {data.riskSummary.riskLevel}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Basado en dispersión estocástica
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Tabla Comparativa de Escenarios */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Escenarios de Evaluación</CardTitle>
            <CardDescription>
              Comportamiento de VPN, TIR, B/C y Payback bajo diferentes premisas operativas
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Escenario</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Probabilidad</TableHead>
                  <TableHead className="text-right">Tasa Desc.</TableHead>
                  <TableHead className="text-right">Var. Ingresos</TableHead>
                  <TableHead className="text-right">VPN ($)</TableHead>
                  <TableHead className="text-right">TIR (%)</TableHead>
                  <TableHead className="text-right">B/C</TableHead>
                  <TableHead className="text-right">Payback</TableHead>
                  <TableHead className="text-right w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.scenarios.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {s.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{s.probability}%</TableCell>
                    <TableCell className="text-right">
                      {s.parameters?.discountRate ?? data.baseDiscountRate}%
                    </TableCell>
                    <TableCell className="text-right">
                      {s.parameters?.inflowVariationPct !== undefined
                        ? `${s.parameters.inflowVariationPct >= 0 ? "+" : ""}${s.parameters.inflowVariationPct}%`
                        : "0%"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${
                        (s.results?.npv ?? 0) >= 0 ? "text-emerald-600" : "text-destructive"
                      }`}
                    >
                      ${s.results?.npv.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {s.results?.irr !== null && s.results?.irr !== undefined
                        ? `${(s.results.irr * 100).toFixed(2)}%`
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {s.results?.benefitCostRatio ?? "-"}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {s.results?.paybackPeriod !== null && s.results?.paybackPeriod !== undefined
                        ? `${s.results.paybackPeriod} años`
                        : "No recupera"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => openEditDialog(s)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        {s.type === "custom" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(s.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 4. Gráfico Tornado y Puntos de Equilibrio */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gráfico Tornado (2 Cols) */}
        <Card className="lg:col-span-2 border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              Gráfico Tornado (Sensibilidad Unidimensional &plusmn;20%)
            </CardTitle>
            <CardDescription>
              Mide la amplitud del impacto (swing) en el VPN al variar cada variable de forma aislada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={tornadoChartData}
                  margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                  <XAxis
                    type="number"
                    tickFormatter={(val) => `$${Number(val) >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    tickLine={false}
                  />
                  <YAxis type="category" dataKey="name" tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`Impacto (Swing): $${Number(val).toLocaleString()}`, "Amplitud"]}
                    contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px" }}
                  />
                  <Bar dataKey="swing" fill="var(--primary)" radius={[0, 4, 4, 0]}>
                    {tornadoChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? "var(--primary)" : index === 1 ? "#3b82f6" : "#64748b"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-muted-foreground text-center">
              * Variables ordenadas de mayor a menor criticidad según la volatilidad que inducen sobre el VPN.
            </div>
          </CardContent>
        </Card>

        {/* Puntos de Equilibrio (1 Col) */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Puntos de Equilibrio (VPN = 0)
            </CardTitle>
            <CardDescription>Umbrales límite de tolerancia del proyecto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {breakevenPoints.map((be) => (
              <div key={be.variable} className="p-3 rounded-lg border bg-muted/30 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{be.variableLabel}</span>
                  <Badge variant="outline" className="text-xs">
                    {be.variable === "discount_rate"
                      ? `${be.breakevenValue}%`
                      : be.variable === "initial_investment"
                      ? `$${be.breakevenValue.toLocaleString()}`
                      : `${be.breakevenValue}%`}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{be.interpretation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 5. Matriz de Sensibilidad Bidimensional (Heatmap) */}
      {heatmapData && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Matriz Heatmap Bidimensional (Tasa de Descuento vs. Variación de Ingresos)
            </CardTitle>
            <CardDescription>
              Valores resultantes de VPN ($) al combinar simultáneamente fluctuaciones en la tasa de interés e ingresos operacionales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 border bg-muted font-semibold text-left">
                      Ingresos \ Tasa
                    </th>
                    {heatmapData.xSteps.map((x) => (
                      <th key={x} className="p-2 border bg-muted font-semibold">
                        {x.toFixed(1)}%
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.matrix.map((row, rIdx) => {
                    const yVal = heatmapData.ySteps[rIdx];
                    return (
                      <tr key={rIdx}>
                        <td className="p-2 border font-semibold bg-muted/40 text-left">
                          {yVal >= 0 ? `+${yVal}%` : `${yVal}%`} Ingresos
                        </td>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`p-2 border font-mono font-medium transition-colors ${
                              cell.isViable
                                ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold"
                                : "bg-destructive/10 text-destructive dark:text-red-400"
                            }`}
                          >
                            ${cell.npv.toLocaleString()}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500" />
                  Zona Viable (VPN &ge; 0)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-destructive/20 border border-destructive" />
                  Zona Crítica / Pérdida (VPN &lt; 0)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Dialog para Crear / Editar Escenario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingScenario ? "Modificar Escenario" : "Crear Escenario de Análisis"}
              </DialogTitle>
              <DialogDescription>
                Define parámetros de variación porcentual sobre ingresos, egresos y tasas de evaluación.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Escenario</Label>
                <Input
                  id="name"
                  placeholder="ej. Escenario de Expansión Rápida"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">Base</SelectItem>
                      <SelectItem value="optimistic">Optimista</SelectItem>
                      <SelectItem value="pessimistic">Pesimista</SelectItem>
                      <SelectItem value="expected">Esperado</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="probability">Probabilidad (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción / Supuestos</Label>
                <Input
                  id="description"
                  placeholder="ej. Se asume un aumento de precios de venta del 10%"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountRate">Tasa de Descuento (%)</Label>
                  <Input
                    id="discountRate"
                    type="number"
                    step="0.1"
                    value={formData.discountRate}
                    onChange={(e) => setFormData({ ...formData, discountRate: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inflowVariationPct">Var. Ingresos (%)</Label>
                  <Input
                    id="inflowVariationPct"
                    type="number"
                    step="1"
                    value={formData.inflowVariationPct}
                    onChange={(e) => setFormData({ ...formData, inflowVariationPct: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="outflowVariationPct">Var. Costos Operativos (%)</Label>
                  <Input
                    id="outflowVariationPct"
                    type="number"
                    step="1"
                    value={formData.outflowVariationPct}
                    onChange={(e) => setFormData({ ...formData, outflowVariationPct: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investmentVariationPct">Var. Inversión CAPEX (%)</Label>
                  <Input
                    id="investmentVariationPct"
                    type="number"
                    step="1"
                    value={formData.investmentVariationPct}
                    onChange={(e) => setFormData({ ...formData, investmentVariationPct: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Calculando..." : editingScenario ? "Actualizar" : "Crear Escenario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
