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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ArrowLeft,
  FolderKanban,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  PieChart,
  Landmark,
  Scale,
  Sparkles,
} from "lucide-react";
import * as proFormaService from "@/lib/services/pro-forma";
import { routes } from "@/lib/routes";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProjectProFormaPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [report, setReport] = useState<proFormaService.ProjectProFormaReport | null>(null);
  const [viewMode, setViewMode] = useState<"unleveraged" | "leveraged">("unleveraged");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await proFormaService.generateProjectProFormaReport(id, 35);
      setReport(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al generar estados pro-forma.");
      toast.error("Error al calcular estados financieros pro-forma.");
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
          <p className="text-sm text-muted-foreground">Generando Estado de Resultados y Flujo de Caja Libre...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
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

  // Gráfico de flujo de caja según el modo seleccionado
  const chartData = report.cashFlowStatement.map((row) => ({
    period: `Año ${row.period}`,
    fcl: row.freeCashFlowFirm,
    fca: row.freeCashFlowEquity,
    utilidadNeta: row.netIncome,
  }));

  const activeNpv = viewMode === "unleveraged" ? report.unleveragedNpv : report.leveragedNpv;
  const activeBaue = viewMode === "unleveraged" ? report.baueUnleveraged : report.baueLeveraged;

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* 1. Header con Toggle de Financiamiento */}
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
              {report.projectName}
            </span>
            <span>/</span>
            <span className="text-foreground font-medium">Pro-Forma & FCL</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Estados Financieros Pro-Forma
            </h1>
            <Badge variant="outline" className="text-xs">
              <FileSpreadsheet className="w-3 h-3 mr-1 text-primary" />
              Flujo de Caja Libre
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Integración de ingresos, costos operativos, depreciación de activos fijos, intereses de deuda y cálculo del BAUE / CAUE.
          </p>
        </div>

        {/* Toggle Apalancado / Desapalancado */}
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg border">
          <Button
            variant={viewMode === "unleveraged" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("unleveraged")}
            className="text-xs font-semibold"
          >
            Sin Deuda (FCL / FCFF)
          </Button>
          <Button
            variant={viewMode === "leveraged" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("leveraged")}
            className="text-xs font-semibold"
          >
            Con Deuda (FCA / FCFE)
          </Button>
        </div>
      </div>

      {/* 2. Tarjetas KPI de Rentabilidad y BAUE */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {viewMode === "unleveraged" ? "VPN del Proyecto (FCL)" : "VPN del Accionista (FCA)"}
            </CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                activeNpv >= 0 ? "text-emerald-600" : "text-destructive"
              }`}
            >
              ${activeNpv.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {viewMode === "unleveraged"
                ? "Evaluación pura del negocio"
                : "Ajustado por escudo fiscal y amortización"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              BAUE / CAUE Anual
            </CardTitle>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                activeBaue >= 0 ? "text-emerald-600" : "text-destructive"
              }`}
            >
              ${activeBaue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Beneficio Anual Uniforme Equivalente
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              EBITDA Consolidado
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${report.totalEbitda.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Flujo operativo antes de depreciación e intereses
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Utilidad Neta Total
            </CardTitle>
            <Scale className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${report.totalNetIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Resultado final contable post-impuestos (35%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Estado de Resultados Pro-Forma */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Estado de Resultados Pro-Forma Proyectado</CardTitle>
          <CardDescription>
            Ingresos operacionales, costos, deducciones por depreciación, intereses de créditos e impuestos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48 font-semibold">Concepto / Partida ($)</TableHead>
                  {report.incomeStatement.map((col) => (
                    <TableHead key={col.period} className="text-right">
                      Año {col.period}
                    </TableHead>
                  ))}
                  <TableHead className="text-right font-bold bg-muted/30">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold text-emerald-700 dark:text-emerald-400">
                    (+) Ingresos Operacionales
                  </TableCell>
                  {report.incomeStatement.map((r) => (
                    <TableCell key={r.period} className="text-right font-medium">
                      ${r.revenue.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold bg-muted/30">
                    ${report.totalRevenues.toLocaleString()}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-muted-foreground">(-) Costos y Gastos Operacionales</TableCell>
                  {report.incomeStatement.map((r) => (
                    <TableCell key={r.period} className="text-right text-rose-600">
                      -${r.operatingCosts.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold text-rose-600 bg-muted/30">
                    -${report.totalOperatingCosts.toLocaleString()}
                  </TableCell>
                </TableRow>

                <TableRow className="bg-muted/40 font-bold">
                  <TableCell>(=) EBITDA (Utilidad Operacional Bruta)</TableCell>
                  {report.incomeStatement.map((r) => (
                    <TableCell key={r.period} className="text-right">
                      ${r.ebitda.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right bg-muted/50">
                    ${report.totalEbitda.toLocaleString()}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-muted-foreground">(-) Depreciación de Activos Fijos</TableCell>
                  {report.incomeStatement.map((r) => (
                    <TableCell key={r.period} className="text-right text-amber-600">
                      -${r.depreciation.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold text-amber-600 bg-muted/30">
                    -${report.totalDepreciation.toLocaleString()}
                  </TableCell>
                </TableRow>

                <TableRow className="font-semibold">
                  <TableCell>(=) EBIT (Utilidad antes de Intereses e Impuestos)</TableCell>
                  {report.incomeStatement.map((r) => (
                    <TableCell key={r.period} className="text-right">
                      ${r.ebit.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold bg-muted/30">
                    ${(report.totalEbitda - report.totalDepreciation).toLocaleString()}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-muted-foreground">(-) Gastos por Intereses de Deuda</TableCell>
                  {report.incomeStatement.map((r) => (
                    <TableCell key={r.period} className="text-right text-amber-600">
                      -${r.interestExpense.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold text-amber-600 bg-muted/30">
                    -${report.totalInterest.toLocaleString()}
                  </TableCell>
                </TableRow>

                <TableRow className="font-medium">
                  <TableCell>(=) EBT (Utilidad antes de Impuestos)</TableCell>
                  {report.incomeStatement.map((r) => (
                    <TableCell key={r.period} className="text-right">
                      ${r.ebt.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold bg-muted/30">
                    ${(report.totalEbitda - report.totalDepreciation - report.totalInterest).toLocaleString()}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-muted-foreground">(-) Impuesto de Renta (35%)</TableCell>
                  {report.incomeStatement.map((r) => (
                    <TableCell key={r.period} className="text-right text-rose-600">
                      -${r.taxes.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold text-rose-600 bg-muted/30">
                    -${report.totalTaxes.toLocaleString()}
                  </TableCell>
                </TableRow>

                <TableRow className="bg-primary/5 font-bold border-t-2">
                  <TableCell className="text-primary font-bold">(=) Utilidad Neta del Ejercicio</TableCell>
                  {report.incomeStatement.map((r) => (
                    <TableCell
                      key={r.period}
                      className={`text-right ${r.netIncome >= 0 ? "text-emerald-600" : "text-destructive"}`}
                    >
                      ${r.netIncome.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-extrabold text-primary bg-primary/10">
                    ${report.totalNetIncome.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 4. Estado de Flujo de Caja Libre (FCL / FCFF) y del Accionista (FCA / FCFE) */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Flujo de Caja Libre (FCFF) y Flujo del Accionista (FCFE)</CardTitle>
          <CardDescription>
            Reconciliación desde la Utilidad Neta añadiendo partidas no monetarias (depreciación) y deduciendo inversiones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-52 font-semibold">Flujo de Efectivo ($)</TableHead>
                  {report.cashFlowStatement.map((col) => (
                    <TableHead key={col.period} className="text-right">
                      Año {col.period}
                    </TableHead>
                  ))}
                  <TableHead className="text-right font-bold bg-muted/30">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Utilidad Neta</TableCell>
                  {report.cashFlowStatement.map((r) => (
                    <TableCell key={r.period} className="text-right">
                      ${r.netIncome.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold bg-muted/30">
                    ${report.totalNetIncome.toLocaleString()}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-muted-foreground">(+) Depreciación (No monetario)</TableCell>
                  {report.cashFlowStatement.map((r) => (
                    <TableCell key={r.period} className="text-right text-emerald-600">
                      +${r.depreciation.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold text-emerald-600 bg-muted/30">
                    +${report.totalDepreciation.toLocaleString()}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-muted-foreground">(-) CAPEX Operativo</TableCell>
                  {report.cashFlowStatement.map((r) => (
                    <TableCell key={r.period} className="text-right text-rose-600">
                      -${r.capex.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold text-rose-600 bg-muted/30">
                    -${report.cashFlowStatement.reduce((s, r) => s + r.capex, 0).toLocaleString()}
                  </TableCell>
                </TableRow>

                <TableRow className="bg-muted/50 font-bold">
                  <TableCell className="text-foreground">
                    (=) Flujo de Caja Libre del Negocio (FCL / FCFF)
                  </TableCell>
                  {report.cashFlowStatement.map((r) => (
                    <TableCell
                      key={r.period}
                      className={`text-right font-bold ${
                        r.freeCashFlowFirm >= 0 ? "text-emerald-600" : "text-destructive"
                      }`}
                    >
                      ${r.freeCashFlowFirm.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-extrabold bg-muted/70">
                    ${report.totalFreeCashFlowFirm.toLocaleString()}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-muted-foreground">(+) Desembolsos Nuevos de Deuda</TableCell>
                  {report.cashFlowStatement.map((r) => (
                    <TableCell key={r.period} className="text-right text-blue-600">
                      ${r.debtDisbursements.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold text-blue-600 bg-muted/30">
                    ${report.cashFlowStatement.reduce((s, r) => s + r.debtDisbursements, 0).toLocaleString()}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="text-muted-foreground">(-) Amortización de Principal</TableCell>
                  {report.cashFlowStatement.map((r) => (
                    <TableCell key={r.period} className="text-right text-rose-600">
                      -${r.debtPrincipalRepayment.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold text-rose-600 bg-muted/30">
                    -${report.cashFlowStatement.reduce((s, r) => s + r.debtPrincipalRepayment, 0).toLocaleString()}
                  </TableCell>
                </TableRow>

                <TableRow className="bg-emerald-500/10 font-bold border-t-2">
                  <TableCell className="text-emerald-700 dark:text-emerald-400">
                    (=) Flujo de Caja del Accionista (FCA / FCFE)
                  </TableCell>
                  {report.cashFlowStatement.map((r) => (
                    <TableCell
                      key={r.period}
                      className={`text-right font-bold ${
                        r.freeCashFlowEquity >= 0 ? "text-emerald-600" : "text-destructive"
                      }`}
                    >
                      ${r.freeCashFlowEquity.toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/20">
                    ${report.totalFreeCashFlowEquity.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 5. Gráfico de Comparación de Flujos */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Evolución de Flujos de Caja Proyectados</CardTitle>
          <CardDescription>
            Comparación entre Flujo Libre del Negocio (FCL), Flujo del Accionista (FCA) y Utilidad Neta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="period" tickLine={false} />
                <YAxis
                  tickFormatter={(val) => `$${Number(val) >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, ""]}
                  contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px" }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="fcl" name="Flujo Libre (FCL)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fca" name="Flujo Accionista (FCA)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="utilidadNeta" name="Utilidad Neta" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
