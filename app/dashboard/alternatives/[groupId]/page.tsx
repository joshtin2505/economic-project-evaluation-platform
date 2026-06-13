"use client"

import React, { useState, useEffect, use, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts"
import {
  ArrowLeft,
  GitCompare,
  TrendingUp,
  Scale,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  TrendingDown,
} from "lucide-react"
import * as alternativesService from "@/lib/services/alternatives-analysis"
import * as projectGroupsService from "@/lib/services/project-groups"

interface Props {
  params: Promise<{ groupId: string }>
}

const chartConfig = {
  npv: {
    label: "VPN ($)",
    color: "var(--primary)",
  },
  irr: {
    label: "TIR (%)",
    color: "var(--success)",
  },
} satisfies ChartConfig

export default function AlternativeDetailsPage({ params }: Props) {
  const { groupId } = use(params)
  const router = useRouter()
  
  const [analysis, setAnalysis] = useState<alternativesService.AlternativesAnalysisResult | null>(null)
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isWinnerSubmitting, setIsWinnerSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await alternativesService.analyzeAlternativesInGroup(groupId)
      setAnalysis(data)
      
      // Obtener el grupo completo para ver si ya tiene un ganador seleccionado
      const fullGroup = await projectGroupsService.fetchProjectGroupById(groupId)
      setSelectedWinnerId(fullGroup.selected_project_id)
    } catch (err) {
      console.error(err)
      toast.error("Error al cargar el análisis comparativo.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [groupId])

  const handleSelectWinner = async (projectId: string | null) => {
    setIsWinnerSubmitting(true)
    try {
      await projectGroupsService.selectWinningProject(groupId, projectId)
      setSelectedWinnerId(projectId)
      toast.success(projectId ? "Alternativa ganadora seleccionada correctamente." : "Selección de ganador removida.")
      void loadData()
    } catch (err) {
      console.error(err)
      toast.error("Error al guardar la selección.")
    } finally {
      setIsWinnerSubmitting(false)
    }
  }

  // Preparar datos de gráficos
  const chartData = useMemo(() => {
    if (!analysis) return []
    return analysis.metrics.map(m => ({
      name: m.projectName,
      npv: Math.round(m.npv),
      irr: m.irr ? Number((m.irr * 100).toFixed(1)) : 0,
    }))
  }, [analysis])

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Cargando análisis comparativo de alternativas...
      </div>
    )
  }

  if (!analysis || analysis.metrics.length === 0) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/alternatives">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Alternativas
          </Link>
        </Button>
        <Card className="border-destructive/40">
          <CardContent className="py-6 text-center text-destructive flex flex-col items-center gap-2">
            <AlertTriangle className="h-10 w-10" />
            <p className="font-semibold text-lg">No se pudo realizar el análisis</p>
            <p className="text-sm text-muted-foreground">
              Asegúrate de que el grupo exista y contenga al menos 2 proyectos guardados con flujos de caja.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Button variant="outline" size="sm" className="mb-2" asChild>
            <Link href="/dashboard/alternatives">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GitCompare className="h-6 w-6 text-primary" />
            {analysis.groupName}
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Comparativa bajo una TMAR común del {(analysis.comparisonRate * 100).toFixed(1)}%.
          </p>
        </div>
      </div>

      {/* Recommended Alternative Banner */}
      <Card className="bg-gradient-to-r from-primary/5 via-success/5 to-transparent border-primary/20">
        <CardContent className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-success text-success-foreground hover:bg-success/90">
                <Award className="mr-1 h-3 w-3" /> Recomendación Económica
              </Badge>
              {selectedWinnerId && (
                <Badge variant="outline" className="border-primary/50 text-primary">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Ganador Seleccionado
                </Badge>
              )}
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              {analysis.recommendationExplanation}
            </p>
          </div>
          {analysis.recommendedProjectId && (
            <div className="shrink-0 flex flex-col gap-2 w-full md:w-auto">
              <div className="p-3 bg-background rounded-lg border text-center shadow-sm">
                <span className="text-xs text-muted-foreground block font-medium">Alternativa Óptima</span>
                <span className="font-bold text-success text-lg block truncate max-w-[200px]">
                  {analysis.metrics.find(m => m.projectId === analysis.recommendedProjectId)?.projectName}
                </span>
              </div>
              {selectedWinnerId !== analysis.recommendedProjectId && (
                <Button
                  size="sm"
                  onClick={() => handleSelectWinner(analysis.recommendedProjectId)}
                  disabled={isWinnerSubmitting}
                  className="w-full"
                >
                  Confirmar Ganador
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main comparative Table */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas Financieras Homogéneas</CardTitle>
          <CardDescription>
            Todas las métricas de VPN, Beneficio/Costo e Índice de Rentabilidad se recalculan utilizando la tasa común del grupo ({(analysis.comparisonRate * 100).toFixed(1)}%).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alternativa</TableHead>
                  <TableHead className="text-right">Inversión Inicial</TableHead>
                  <TableHead className="text-right">VPN (al {(analysis.comparisonRate * 100).toFixed(1)}%)</TableHead>
                  <TableHead className="text-right">TIR (Propia)</TableHead>
                  <TableHead className="text-right">Relación B/C</TableHead>
                  <TableHead className="text-right">Pto. Recupero (Años)</TableHead>
                  <TableHead className="text-right">Índice Rentabilidad</TableHead>
                  <TableHead className="text-center">Selección</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.metrics.map(m => {
                  const isRecommended = m.projectId === analysis.recommendedProjectId
                  const isWinner = m.projectId === selectedWinnerId
                  return (
                    <TableRow key={m.projectId} className={`hover:bg-muted/30 ${isRecommended ? "bg-success/5 hover:bg-success/10" : ""}`}>
                      <TableCell className="font-semibold">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5">
                            {m.projectName}
                            {isRecommended && (
                              <Badge variant="outline" className="border-success/30 text-success text-[10px] py-0 px-1.5 bg-success/5">
                                Óptimo
                              </Badge>
                            )}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            Plazo: {m.periods} años | TMAR propia: {(m.ownDiscountRate * 100).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        ${m.initialInvestment.toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-medium ${m.npv >= 0 ? "text-success" : "text-destructive"}`}>
                        ${Math.round(m.npv).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {m.irr !== null ? `${(m.irr * 100).toFixed(1)}%` : "N/A"}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-xs ${m.benefitCostRatio >= 1 ? "text-success" : "text-destructive"}`}>
                        {m.benefitCostRatio.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {m.paybackPeriod !== null ? `${m.paybackPeriod.toFixed(1)}` : "No recupera"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {m.profitabilityIndex.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {isWinner ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="bg-primary/10 text-primary border border-primary/20 h-7 text-xs font-semibold"
                            onClick={() => handleSelectWinner(null)}
                            disabled={isWinnerSubmitting}
                          >
                            Ganador
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs font-normal"
                            onClick={() => handleSelectWinner(m.projectId)}
                            disabled={isWinnerSubmitting}
                          >
                            Seleccionar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Visual Charts Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-primary" />
              Comparativa de VPN
            </CardTitle>
            <CardDescription>VPN recalculado a la TMAR de comparación común</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent formatter={(val) => [`$${Number(val).toLocaleString()}`, "VPN"]} />} />
                <Bar dataKey="npv" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-success" />
              Tasa Interna de Retorno (TIR)
            </CardTitle>
            <CardDescription>TIR intrínseca de cada alternativa vs TMAR común</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} tick={{ fontSize: 10 }} />
                <ChartTooltip content={<ChartTooltipContent formatter={(val) => [`${val}%`, "TIR"]} />} />
                <Bar dataKey="irr" fill="var(--success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pairwise Incremental Analysis Stepper / Timeline */}
      {analysis.incrementalSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Análisis Económico Incremental</CardTitle>
            <CardDescription>
              Comparación pareada secuencial. El criterio incremental (TIR incremental vs TMAR) justifica o descarta invertir capital adicional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative pl-6 border-l border-muted-foreground/30 space-y-8">
              {analysis.incrementalSteps.map((step, idx) => {
                const isSwitched = step.decision === "switch_to_B"
                return (
                  <div key={idx} className="relative">
                    {/* Circle icon on the line */}
                    <div className={`absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-background ${isSwitched ? "border-success text-success" : "border-muted-foreground/50 text-muted-foreground"}`}>
                      <span className="text-[10px] font-bold">{idx + 1}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="font-semibold text-sm flex items-center gap-1.5">
                          Paso {idx + 1}: {step.alternativeAName} vs {step.alternativeBName}
                        </h4>
                        <Badge variant="outline" className={isSwitched ? "border-success/50 bg-success/5 text-success" : "border-muted-foreground/50 text-muted-foreground"}>
                          {isSwitched ? "Cambio de Campeón" : "Se Mantiene Campeón"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 rounded-lg bg-muted/30 p-3 text-xs">
                        <div>
                          <span className="text-muted-foreground">Inversión Incremental (ΔI)</span>
                          <span className="block font-mono font-semibold mt-0.5">
                            ${step.deltaInvestment.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">VPN Incremental (ΔVPN)</span>
                          <span className={`block font-mono font-semibold mt-0.5 ${step.deltaNpv >= 0 ? "text-success" : "text-destructive"}`}>
                            ${Math.round(step.deltaNpv).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">TIR Incremental (ΔTIR)</span>
                          <span className="block font-mono font-semibold mt-0.5">
                            {step.deltaIrr !== null ? `${(step.deltaIrr * 100).toFixed(1)}%` : "N/A"}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed pl-1">
                        {step.explanation}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decision Help Box */}
      <Card className="border-border bg-muted/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            ¿Cómo interpretar el Análisis Incremental?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
          <p>
            Al comparar alternativas mutuamente excluyentes, el proyecto con el mayor VPN no siempre es la mejor decisión si requiere un incremento desproporcionado de inversión.
          </p>
          <p>
            1. Ordenamos las alternativas por nivel de inversión inicial.
          </p>
          <p>
            2. Analizamos el rendimiento del <strong>capital adicional necesario</strong> para pasar de la alternativa barata a la cara (Inversión Incremental).
          </p>
          <p>
            3. Si la <strong>TIR Incremental</strong> es superior a la TMAR requerida (o si el <strong>VPN Incremental</strong> es positivo), significa que el capital extra rinde por encima del mínimo exigido. Por ende, conviene invertir más y elegir la alternativa de mayor inversión. Si no se cumple, nos quedamos con la alternativa de menor inversión.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
