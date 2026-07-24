"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Calculator,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Scale,
  TrendingUp,
  ArrowDown,
  ArrowRight,
  DollarSign,
  Percent,
} from "lucide-react";
import * as projectService from "@/lib/services/projects";
import {
  getEffectiveDiscountRate,
  selectFeaturedProject,
  type ProjectRecord,
} from "@/lib/services/project-analytics";
import {
  formatRatePercent,
  getBenefitCostRatio,
} from "@/lib/utils/project-results";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import * as projectAnalytics from "@/lib/services/project-analytics";
import { useProjectAnalysis } from "@/lib/hooks/useProjectAnalysis";

export default function ReportsPage() {
  const t = useTranslations("dashboard.reports");
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const projectRows =
          (await projectService.fetchProjects()) as ProjectRecord[];
        setProjects(projectRows);

        const defaultProject = selectFeaturedProject(projectRows);
        if (defaultProject) {
          setSelectedProjectId(defaultProject.id);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load reports data",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadProjects();
  }, []);

  const selectedProject = useMemo(
    () =>
      projects.find((project) => project.id === selectedProjectId) ||
      projects[0] ||
      null,
    [projects, selectedProjectId],
  );

  // Use project analysis hook to get cash flows
  const { selectedCashFlows: analysisCashFlows } = useProjectAnalysis({});

  const effectiveDiscountRate = selectedProject
    ? getEffectiveDiscountRate(selectedProject)
    : 0;
  const usingTmarAsRate = selectedProject?.use_tmar_as_discount_rate ?? false;
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // PDF export function
  const handleExportPDF = async () => {
    setIsExporting("pdf");
    try {
      // Dynamic import to avoid build issues
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const element = document.getElementById("report-content");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Reporte_Proyecto_${selectedProject?.name || "Proyecto"}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      // Fallback to print if libraries are not available
      alert(
        "Las librerías de exportación PDF no están instaladas. Usando impresión nativa como alternativa.",
      );
      window.print();
    } finally {
      setIsExporting(null);
    }
  };

  // Excel export function
  const handleExportExcel = async () => {
    setIsExporting("excel");
    try {
      const XLSX = (await import("xlsx")).default;

      if (!selectedProject || !detailedCashFlows.length) return;

      // Sheet 1: Executive Summary
      const summaryData = [
        ["Indicador", "Valor"],
        ["Nombre del Proyecto", selectedProject.name],
        ["Inversión Inicial", toNumber(selectedProject.initial_investment)],
        ["Período de Análisis", selectedProject.periods],
        ["Tasa de Descuento", effectiveDiscountRate + "%"],
        ["VPN", selectedProject.results?.npv || 0],
        ["TIR", selectedProject.results?.irr || 0],
        ["Relación B/C", getBenefitCostRatio(selectedProject.results) || 0],
        [
          "Índice de Rentabilidad",
          selectedProject.results?.profitabilityIndex || 0,
        ],
        [
          "Período de Recuperación",
          selectedProject.results?.paybackPeriod || 0,
        ],
        ["TMAR", selectedProject.results?.tmar || 0],
        ["Viable", selectedProject.results?.isViable ? "Sí" : "No"],
      ];

      // Sheet 2: Capital Structure (if mixed method)
      let capitalData: any[][] = [];
      if (
        selectedProject.tmar_method === "mixta" &&
        selectedProject.funding_sources
      ) {
        capitalData = [
          [
            "Fuente de Financiamiento",
            "% Participación",
            "Tasa de Costo",
            "Costo Ponderado",
          ],
          ...selectedProject.funding_sources.map((source: any) => [
            source.name || `Fuente`,
            toNumber(source.share),
            toNumber(source.rate),
            (toNumber(source.share) / 100) * toNumber(source.rate),
          ]),
          ["Total", 100, "", effectiveDiscountRate],
        ];
      }

      // Sheet 3: Cash Flow
      const cashFlowData = [
        [
          "Año",
          "Ingresos Brutos",
          "Egresos/Costos",
          "Valor de Salvamento",
          "Flujo Neto (FNE)",
          "FNE Descontado",
        ],
        ...detailedCashFlows.map((flow) => [
          flow.year,
          flow.grossInflow,
          flow.operatingCost,
          flow.salvageValue,
          flow.netCashFlow,
          flow.discountedNCF,
        ]),
        [
          "Total",
          detailedCashFlows.reduce((sum, f) => sum + f.grossInflow, 0),
          detailedCashFlows.reduce((sum, f) => sum + f.operatingCost, 0),
          detailedCashFlows.reduce((sum, f) => sum + f.salvageValue, 0),
          detailedCashFlows.reduce((sum, f) => sum + f.netCashFlow, 0),
          detailedCashFlows.reduce((sum, f) => sum + f.discountedNCF, 0),
        ],
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Resumen Ejecutivo");

      if (capitalData.length > 0) {
        const capitalWs = XLSX.utils.aoa_to_sheet(capitalData);
        XLSX.utils.book_append_sheet(wb, capitalWs, "Estructura Capital");
      }

      const cashFlowWs = XLSX.utils.aoa_to_sheet(cashFlowData);
      XLSX.utils.book_append_sheet(wb, cashFlowWs, "Flujo de Caja");

      XLSX.writeFile(
        wb,
        `Reporte_Proyecto_${selectedProject.name || "Proyecto"}.xlsx`,
      );
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert("Error al exportar Excel.");
    } finally {
      setIsExporting(null);
    }
  };

  // CSV export function
  const handleExportCSV = () => {
    setIsExporting("csv");
    try {
      if (!selectedProject || !detailedCashFlows.length) return;

      // Create CSV content with BOM for UTF-8
      const BOM = "\uFEFF";

      // Summary section
      let csv = BOM + "RESUMEN EJECUTIVO\n";
      csv += "Indicador,Valor\n";
      csv += `Nombre del Proyecto,"${selectedProject.name}"\n`;
      csv += `Inversión Inicial,${toNumber(selectedProject.initial_investment)}\n`;
      csv += `Período de Análisis,${selectedProject.periods}\n`;
      csv += `Tasa de Descuento,${effectiveDiscountRate}%\n`;
      csv += `VPN,${selectedProject.results?.npv || 0}\n`;
      csv += `TIR,${selectedProject.results?.irr || 0}%\n`;
      csv += `Relación B/C,${getBenefitCostRatio(selectedProject.results) || 0}\n`;
      csv += `Índice de Rentabilidad,${selectedProject.results?.profitabilityIndex || 0}\n`;
      csv += `Período de Recuperación,${selectedProject.results?.paybackPeriod || 0}\n`;
      csv += `TMAR,${selectedProject.results?.tmar || 0}%\n`;
      csv += `Viable,${selectedProject.results?.isViable ? "Sí" : "No"}\n`;
      csv += "\n";

      // Cash Flow section
      csv += "FLUJO DE CAJA DETALLADO\n";
      csv +=
        "Año,Ingresos Brutos,Egresos/Costos,Valor de Salvamento,Flujo Neto (FNE),FNE Descontado\n";
      detailedCashFlows.forEach((flow) => {
        csv += `${flow.year},${flow.grossInflow},${flow.operatingCost},${flow.salvageValue},${flow.netCashFlow},${flow.discountedNCF}\n`;
      });

      // Total row
      csv += `Total,${detailedCashFlows.reduce((sum, f) => sum + f.grossInflow, 0)},${detailedCashFlows.reduce((sum, f) => sum + f.operatingCost, 0)},${detailedCashFlows.reduce((sum, f) => sum + f.salvageValue, 0)},${detailedCashFlows.reduce((sum, f) => sum + f.netCashFlow, 0)},${detailedCashFlows.reduce((sum, f) => sum + f.discountedNCF, 0)}\n`;

      // Create blob and download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `Reporte_Proyecto_${selectedProject.name || "Proyecto"}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Error al exportar CSV.");
    } finally {
      setIsExporting(null);
    }
  };

  // Calculate detailed cash flow data
  const detailedCashFlows = useMemo(() => {
    if (!selectedProject || !analysisCashFlows) return [];
    const rate = effectiveDiscountRate / 100;
    const initialInvestment = toNumber(selectedProject.initial_investment);

    return analysisCashFlows.map((flow, index) => {
      const year = flow.period;
      const grossInflow = toNumber(flow.inflow);
      const operatingCost = toNumber(flow.outflow);
      const salvageValue = index === analysisCashFlows.length - 1 ? 0 : 0; // Could be added later
      const netCashFlow = grossInflow - operatingCost + salvageValue;
      const discountFactor = 1 / Math.pow(1 + rate, year);
      const discountedNCF = netCashFlow * discountFactor;

      return {
        year,
        grossInflow,
        operatingCost,
        salvageValue,
        netCashFlow,
        discountFactor,
        discountedNCF,
      };
    });
  }, [selectedProject, analysisCashFlows, effectiveDiscountRate]);

  // Calculate cumulative cash flow for payback chart
  const cumulativeCashFlow = useMemo(() => {
    if (!selectedProject || !detailedCashFlows) return [];
    const initialInvestment = toNumber(selectedProject.initial_investment);
    let cumulative = -initialInvestment;

    return [
      { year: 0, cumulative: -initialInvestment },
      ...detailedCashFlows.map((flow) => {
        cumulative += flow.netCashFlow;
        return { year: flow.year, cumulative };
      }),
    ];
  }, [selectedProject, detailedCashFlows]);

  // Calculate waterfall chart data
  const waterfallData = useMemo(() => {
    if (!selectedProject || !detailedCashFlows) return [];
    const initialInvestment = toNumber(selectedProject.initial_investment);

    const data = [
      {
        name: "Initial Investment",
        value: -initialInvestment,
        cumulative: -initialInvestment,
      },
    ];

    let cumulative = -initialInvestment;
    detailedCashFlows.forEach((flow) => {
      cumulative += flow.discountedNCF;
      data.push({
        name: `Year ${flow.year}`,
        value: flow.discountedNCF,
        cumulative,
      });
    });

    return data;
  }, [selectedProject, detailedCashFlows]);

  // Calculate Newton-Raphson iterations
  const tirIterations = useMemo(() => {
    if (!selectedProject || !detailedCashFlows) return [];
    const initialInvestment = toNumber(selectedProject.initial_investment);
    let rate = effectiveDiscountRate / 100 || 0.1;
    const iterations = [];

    for (let i = 0; i < 5; i++) {
      let npv = -initialInvestment;
      detailedCashFlows.forEach((flow) => {
        npv += flow.netCashFlow / Math.pow(1 + rate, flow.year);
      });

      let derivative = 0;
      detailedCashFlows.forEach((flow) => {
        derivative -=
          (flow.year * flow.netCashFlow) / Math.pow(1 + rate, flow.year + 1);
      });

      const adjustment = derivative !== 0 ? npv / derivative : 0;
      const newRate = rate - adjustment;

      iterations.push({
        iteration: i + 1,
        rate: (rate * 100).toFixed(2),
        npv: npv.toFixed(0),
        adjustment: (adjustment * 100).toFixed(2),
        newRate: (newRate * 100).toFixed(2),
      });

      rate = newRate;
      if (Math.abs(npv) < 100) break;
    }

    return iterations;
  }, [selectedProject, detailedCashFlows, effectiveDiscountRate]);

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-destructive/40">
          <CardContent className="py-3 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="w-60">
              <SelectValue placeholder={t("selectProject")} />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-md print:hidden">
          <CardContent className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <FileText className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="mt-4 font-semibold">{t("exports.pdf.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("exports.pdf.description")}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting === "pdf"}
            >
              {isExporting === "pdf" ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isExporting === "pdf" ? "Generando..." : t("exports.pdf.action")}
            </Button>
          </CardContent>
        </Card>

        <Card
          hidden
          className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-md print:hidden"
        >
          <CardContent className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
              <FileSpreadsheet className="h-6 w-6 text-success" />
            </div>
            <h3 className="mt-4 font-semibold">{t("exports.excel.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("exports.excel.description")}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExporting === "excel"}
            >
              {isExporting === "excel" ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isExporting === "excel"
                ? "Generando..."
                : t("exports.excel.action")}
            </Button>
          </CardContent>
        </Card>

        <Card
          hidden
          className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-md print:hidden"
        >
          <CardContent className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">{t("exports.csv.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("exports.csv.description")}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={isExporting === "csv"}
            >
              {isExporting === "csv" ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isExporting === "csv" ? "Generando..." : t("exports.csv.action")}
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-md print:hidden">
          <CardContent className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Printer className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-semibold">{t("exports.print.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("exports.print.description")}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" />
              {t("exports.print.action")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="print:p-0 print:m-0 print:border-0! print:ring-0! print:w-full ">
        <CardHeader className="print:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{t("preview.title")}</CardTitle>
              <CardDescription>{t("preview.description")}</CardDescription>
            </div>
            <Badge>{t("preview.badge")}</Badge>
          </div>
        </CardHeader>
        <CardContent className="print:p-0 print:m-0 print:border-0! print:ring-0! print:w-full">
          {!selectedProject ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              {isLoading ? "Loading reports..." : "No projects available yet."}
            </div>
          ) : (
            <div
              id="report-content"
              className="rounded-lg border print:border-0 bg-background p-8 print:p-0"
            >
              <div className="border-b pb-6 text-center">
                <h1 className="text-2xl font-bold">{t("report.title")}</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                  {selectedProject.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("report.generatedOn", {
                    date: new Date().toLocaleDateString(),
                  })}
                </p>
              </div>

              {/* Executive Summary */}
              <div className="mt-6 break-inside-avoid">
                <h2 className="text-lg font-semibold">
                  {t("sections.executiveSummary")}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {t("summary.npv")}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-xl font-bold ${selectedProject.results && (selectedProject.results.npv ?? 0) >= 0 ? "text-success" : "text-destructive"}`}
                    >
                      {selectedProject.results?.npv !== undefined
                        ? `$${selectedProject.results.npv.toLocaleString()}`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {t("summary.irr")}
                      </span>
                    </div>
                    <p className="mt-1 text-xl font-bold">
                      {selectedProject.results?.irr !== undefined
                        ? formatRatePercent(selectedProject.results.irr)
                        : "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {t("summary.bcRatio")}
                      </span>
                    </div>
                    <p className="mt-1 text-xl font-bold">
                      {getBenefitCostRatio(selectedProject.results) !==
                      undefined
                        ? getBenefitCostRatio(selectedProject.results)!.toFixed(
                            2,
                          )
                        : "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {t("summary.verdict")}
                      </span>
                    </div>
                    <p
                      className={`mt-1 text-xl font-bold ${selectedProject.results?.isViable ? "text-success" : "text-destructive"}`}
                    >
                      {selectedProject.results?.isViable
                        ? t("summary.viable")
                        : t("summary.notViable")}
                    </p>
                  </div>
                </div>

                {/* Dynamic Conclusion */}
                <div className="mt-4 rounded-lg bg-primary/5 p-4">
                  <p className="text-sm leading-relaxed">
                    {selectedProject.results?.isViable &&
                    selectedProject.results?.irr &&
                    selectedProject.results?.tmar
                      ? `El proyecto es viable porque la TIR (${formatRatePercent(selectedProject.results.irr)}) supera la TMAR (${formatRatePercent(selectedProject.results.tmar)}) y el VPN es positivo, generando una riqueza incremental de $${(selectedProject.results.npv ?? 0).toLocaleString()}.`
                      : "El proyecto no cumple con los criterios de viabilidad económica."}
                  </p>
                </div>
              </div>

              {/* TMAR Breakdown */}
              {selectedProject.tmar_method === "mixta" &&
                selectedProject.funding_sources && (
                  <div className="mt-6 break-inside-avoid">
                    <h2 className="text-lg font-semibold">
                      Desglose de la TMAR (Método Mixto)
                    </h2>
                    <div className="mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fuente de Financiamiento</TableHead>
                            <TableHead className="text-right">
                              % Participación
                            </TableHead>
                            <TableHead className="text-right">
                              Tasa de Costo
                            </TableHead>
                            <TableHead className="text-right">
                              Costo Ponderado
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedProject.funding_sources.map(
                            (source: any, index: number) => {
                              const share = toNumber(source.share);
                              const rate = toNumber(source.rate);
                              const weightedCost = (share / 100) * rate;
                              return (
                                <TableRow key={index}>
                                  <TableCell>
                                    {source.name || `Fuente ${index + 1}`}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {share.toFixed(1)}%
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {rate.toFixed(1)}%
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {weightedCost.toFixed(2)}%
                                  </TableCell>
                                </TableRow>
                              );
                            },
                          )}
                          <TableRow className="bg-muted/50">
                            <TableCell className="font-semibold">
                              Total
                            </TableCell>
                            <TableCell className="text-right font-semibold font-mono">
                              100.0%
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-right font-semibold font-mono">
                              {effectiveDiscountRate.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

              {/* Detailed Cash Flow Table */}
              <div className="mt-6 break-inside-avoid">
                <h2 className="text-lg font-semibold">
                  Análisis de Flujo de Caja Detallado
                </h2>
                <div className="mt-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Año</TableHead>
                        <TableHead className="text-right">
                          Ingresos Brutos
                        </TableHead>
                        <TableHead className="text-right">
                          Egresos/Costos
                        </TableHead>
                        {/* <TableHead className="text-right">Valor de Salvamento</TableHead> */}
                        <TableHead className="text-right">
                          Flujo Neto (FNE)
                        </TableHead>
                        {/* <TableHead className="text-right">FNE Descontado</TableHead> */}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailedCashFlows.map((flow, index) => (
                        <TableRow key={index}>
                          <TableCell>{flow.year}</TableCell>
                          <TableCell className="text-right font-mono">
                            ${flow.grossInflow.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${flow.operatingCost.toLocaleString()}
                          </TableCell>
                          {/* <TableCell className="text-right font-mono">${flow.salvageValue.toLocaleString()}</TableCell> */}
                          <TableCell className="text-right font-mono">
                            ${flow.netCashFlow.toLocaleString()}
                          </TableCell>
                          {/* <TableCell className="text-right font-mono">${flow.discountedNCF.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell> */}
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-semibold">Total</TableCell>
                        <TableCell className="text-right font-semibold font-mono">
                          $
                          {detailedCashFlows
                            .reduce((sum, f) => sum + f.grossInflow, 0)
                            .toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold font-mono">
                          $
                          {detailedCashFlows
                            .reduce((sum, f) => sum + f.operatingCost, 0)
                            .toLocaleString()}
                        </TableCell>
                        {/* <TableCell className="text-right font-semibold font-mono">
                          ${detailedCashFlows.reduce((sum, f) => sum + f.salvageValue, 0).toLocaleString()}
                        </TableCell> */}
                        <TableCell className="text-right font-semibold font-mono">
                          $
                          {detailedCashFlows
                            .reduce((sum, f) => sum + f.netCashFlow, 0)
                            .toLocaleString()}
                        </TableCell>
                        {/* <TableCell className="text-right font-semibold font-mono">
                          ${detailedCashFlows.reduce((sum, f) => sum + f.discountedNCF, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </TableCell> */}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Charts Section */}
              <div className="mt-6 break-inside-avoid grid print:grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Waterfall Chart */}
                <div>
                  <h2 className="text-lg font-semibold">
                    Gráfico de Cascada (VPN)
                  </h2>
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={waterfallData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip
                          formatter={(value: any) =>
                            typeof value === "number"
                              ? `$${value.toLocaleString()}`
                              : "N/A"
                          }
                          contentStyle={{ fontSize: "12px" }}
                        />
                        <Bar
                          dataKey="value"
                          fill={
                            waterfallData[0]?.value < 0 ? "#ef4444" : "#22c55e"
                          }
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Cumulative Cash Flow Chart */}
                <div>
                  <h2 className="text-lg font-semibold">
                    Flujo Acumulado (Payback)
                  </h2>
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cumulativeCashFlow}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip
                          formatter={(value: any) =>
                            typeof value === "number"
                              ? `$${value.toLocaleString()}`
                              : "N/A"
                          }
                          contentStyle={{ fontSize: "12px" }}
                        />
                        <ReferenceLine
                          y={0}
                          stroke="#666"
                          strokeDasharray="3 3"
                        />
                        <Line
                          type="monotone"
                          dataKey="cumulative"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Newton-Raphson Convergence Log */}
              <div className="mt-6 break-inside-avoid">
                <h2 className="text-lg font-semibold">
                  Memoria de Cálculo TIR (Newton-Raphson)
                </h2>
                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Iteración</TableHead>
                        <TableHead className="text-right">
                          Tasa Actual (%)
                        </TableHead>
                        <TableHead className="text-right">
                          VPN Resultante
                        </TableHead>
                        <TableHead className="text-right">Ajuste (%)</TableHead>
                        <TableHead className="text-right">
                          Nueva Tasa (%)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tirIterations.map((iter) => (
                        <TableRow key={iter.iteration}>
                          <TableCell>{iter.iteration}</TableCell>
                          <TableCell className="text-right font-mono">
                            {iter.rate}%
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${iter.npv}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {iter.adjustment}%
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {iter.newRate}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Project Details */}
              <div className="mt-6 break-inside-avoid">
                <h2 className="text-lg font-semibold">
                  {t("sections.projectDetails")}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("details.initialInvestment")}
                      </span>
                      <span className="font-mono font-medium">
                        $
                        {toNumber(
                          selectedProject.initial_investment,
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("details.analysisPeriod")}
                      </span>
                      <span className="font-medium">
                        {t("details.years", { count: selectedProject.periods })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("details.discountRate")}
                      </span>
                      <span className="font-mono font-medium">
                        {effectiveDiscountRate.toFixed(1)}%
                      </span>
                    </div>
                    {usingTmarAsRate && (
                      <div className="flex justify-between">
                        <span className="text-xs text-primary font-medium">
                          {t("preview.usingTmarAsRate")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("details.paybackPeriod")}
                      </span>
                      <span className="font-medium">
                        {selectedProject.results?.paybackPeriod !== undefined
                          ? `${selectedProject.results.paybackPeriod.toFixed(1)} ${t("details.yearsShort")}`
                          : t("details.na")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("details.profitabilityIndex")}
                      </span>
                      <span className="font-mono font-medium">
                        {selectedProject.results?.profitabilityIndex !==
                        undefined
                          ? selectedProject.results.profitabilityIndex.toFixed(
                              2,
                            )
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("details.tmar")}
                      </span>
                      <span className="font-mono font-medium">
                        {selectedProject.results?.tmar !== undefined
                          ? formatRatePercent(selectedProject.results.tmar, 1)
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}
