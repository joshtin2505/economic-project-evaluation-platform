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
  Legend,
} from "recharts";
import {
  ArrowLeft,
  FolderKanban,
  Landmark,
  Plus,
  Trash2,
  DollarSign,
  Percent,
  Calendar,
  Scale,
  FileSpreadsheet,
} from "lucide-react";
import * as loansService from "@/lib/services/loans";
import { routes } from "@/lib/routes";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProjectFinancingPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [overview, setOverview] = useState<loansService.ProjectLoansOverview | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal para crear crédito
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    lender_name: "",
    principal: 50000,
    annual_rate: 12,
    term_periods: 5,
    payment_type: "french" as loansService.ProjectLoanRecord["payment_type"],
    grace_periods: 0,
    start_period: 1,
    account_code: "2105",
  });

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loansService.fetchProjectLoansOverview(id);
      setOverview(data);

      if (data.loans.length > 0) {
        const fullLoan = await loansService.fetchLoanWithAmortization(data.loans[0].id);
        setSelectedLoan(fullLoan);
      } else {
        setSelectedLoan(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar financiamiento.");
      toast.error("Error al cargar créditos del proyecto.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

  const handleSelectLoan = async (loanId: string) => {
    try {
      const full = await loansService.fetchLoanWithAmortization(loanId);
      setSelectedLoan(full);
    } catch (err: any) {
      toast.error("Error al cargar tabla de amortización.");
    }
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await loansService.createLoan({
        project_id: id,
        lender_name: formData.lender_name,
        principal: Number(formData.principal),
        annual_rate: Number(formData.annual_rate),
        term_periods: Number(formData.term_periods),
        payment_type: formData.payment_type,
        grace_periods: Number(formData.grace_periods),
        start_period: Number(formData.start_period),
        account_code: formData.account_code,
      });

      toast.success("Crédito registrado y tabla de amortización generada.");
      setIsDialogOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al registrar crédito.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLoan = async (loanId: string) => {
    if (!confirm("¿Deseas eliminar este crédito y su tabla de amortización?")) return;
    try {
      await loansService.deleteLoan(loanId);
      toast.success("Crédito eliminado.");
      await loadData();
    } catch (err: any) {
      toast.error("Error al eliminar crédito.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando financiamiento y tablas de amortización...</p>
        </div>
      </div>
    );
  }

  if (error || !overview) {
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

  // Datos para el gráfico de composición de cuota (Capital vs Interés)
  const chartData = selectedLoan?.amortization
    ? selectedLoan.amortization.map((row: any) => ({
        period: `Año ${row.period}`,
        capital: row.principalPayment,
        interes: row.interestPayment,
      }))
    : [];

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
            <span className="text-foreground font-medium">Financiamiento & WACC</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Créditos, Amortización y Costo de Capital (WACC)
            </h1>
            <Badge variant="outline" className="text-xs">
              <Landmark className="w-3 h-3 mr-1 text-primary" />
              Estructura de Capital
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Modelación de préstamos bajo sistemas Francés, Alemán y Americano, tabla de cuotas periódicas y cálculo del Costo Promedio Ponderado de Capital.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Crédito
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.projectAssets(id)}>
              Activos & Depreciación
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Tarjetas KPI de Estructura de Capital y WACC */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Deuda Financiera
            </CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${overview.totalPrincipal.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Participación en capital: {(overview.capitalStructure.debtWeight * 100).toFixed(1)}% (Wd)
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Capital Propio (Equity)
            </CardTitle>
            <Scale className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${overview.capitalStructure.totalEquity.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Participación: {(overview.capitalStructure.equityWeight * 100).toFixed(1)}% (We)
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Costo Deuda Post-Impuestos
            </CardTitle>
            <Percent className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.capitalStructure.costOfDebtAfterTax}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Kd nominal: {overview.capitalStructure.costOfDebtBeforeTax}% (Escudo fiscal 35%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              WACC Ponderado (CPPC)
            </CardTitle>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
              Tasa Clave
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {overview.capitalStructure.wacc}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ke asignado: {overview.capitalStructure.costOfEquity}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Lista de Créditos Registrados */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Créditos del Proyecto</CardTitle>
          <CardDescription>
            Haz clic en un crédito para ver su tabla de amortización detallada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entidad Financiera</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead className="text-right">Monto Principal</TableHead>
                  <TableHead className="text-right">Tasa Anual</TableHead>
                  <TableHead className="text-right">Plazo</TableHead>
                  <TableHead className="text-right">Gracia</TableHead>
                  <TableHead>Código PUC</TableHead>
                  <TableHead className="text-right w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.loans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No hay obligaciones financieras registradas. Agrega un crédito para modelar la amortización.
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.loans.map((loan) => (
                    <TableRow
                      key={loan.id}
                      className={`cursor-pointer transition-colors ${
                        selectedLoan?.id === loan.id ? "bg-muted/70 font-medium" : ""
                      }`}
                      onClick={() => handleSelectLoan(loan.id)}
                    >
                      <TableCell className="font-semibold flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-primary" />
                        {loan.lender_name}
                      </TableCell>
                      <TableCell className="capitalize">
                        {loan.payment_type === "french"
                          ? "Francés (Cuota Fija)"
                          : loan.payment_type === "german"
                          ? "Alemán (Capital Fijo)"
                          : "Americano (Bullet)"}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${Number(loan.principal).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">{loan.annual_rate}%</TableCell>
                      <TableCell className="text-right">{loan.term_periods} períodos</TableCell>
                      <TableCell className="text-right">{loan.grace_periods} períodos</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{loan.account_code || "2105"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteLoan(loan.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 4. Tabla de Amortización y Gráfico del Crédito Seleccionado */}
      {selectedLoan && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                Tabla de Amortización: {selectedLoan.lender_name}
              </CardTitle>
              <CardDescription>
                Detalle período a período del saldo inicial, abono a capital, intereses y cuota total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Período</TableHead>
                      <TableHead className="text-right">Saldo Inicial</TableHead>
                      <TableHead className="text-right">Abono Capital</TableHead>
                      <TableHead className="text-right">Intereses</TableHead>
                      <TableHead className="text-right">Cuota Total</TableHead>
                      <TableHead className="text-right">Saldo Final</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedLoan.amortization.map((row: any) => (
                      <TableRow key={row.period}>
                        <TableCell className="font-semibold">Año {row.period}</TableCell>
                        <TableCell className="text-right">${row.beginningBalance.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium text-blue-600">
                          ${row.principalPayment.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium text-amber-600">
                          ${row.interestPayment.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold text-foreground">
                          ${row.payment.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium text-muted-foreground">
                          ${row.endingBalance.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Composición de Cuotas</CardTitle>
              <CardDescription>Proporción entre Capital e Intereses</CardDescription>
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
                    <Bar dataKey="capital" name="Capital" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="interes" name="Intereses" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Dialog para Registrar Crédito */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleCreateLoan}>
            <DialogHeader>
              <DialogTitle>Registrar Obligación Financiera / Crédito</DialogTitle>
              <DialogDescription>
                Ingresa los términos pactados con la entidad financiera para calcular la amortización.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="lender_name">Entidad Financiera / Prestamista</Label>
                <Input
                  id="lender_name"
                  placeholder="ej. Banco de Desarrollo / Bancolombia"
                  value={formData.lender_name}
                  onChange={(e) => setFormData({ ...formData, lender_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="principal">Monto Principal ($)</Label>
                  <Input
                    id="principal"
                    type="number"
                    min="1"
                    value={formData.principal}
                    onChange={(e) => setFormData({ ...formData, principal: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annual_rate">Tasa Anual (%)</Label>
                  <Input
                    id="annual_rate"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.annual_rate}
                    onChange={(e) => setFormData({ ...formData, annual_rate: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_type">Sistema de Amortización</Label>
                  <Select
                    value={formData.payment_type}
                    onValueChange={(val: any) => setFormData({ ...formData, payment_type: val })}
                  >
                    <SelectTrigger id="payment_type">
                      <SelectValue placeholder="Sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="french">Francés (Cuota Fija)</SelectItem>
                      <SelectItem value="german">Alemán (Capital Fijo)</SelectItem>
                      <SelectItem value="american">Americano (Bullet)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="term_periods">Plazo (Años/Períodos)</Label>
                  <Input
                    id="term_periods"
                    type="number"
                    min="1"
                    value={formData.term_periods}
                    onChange={(e) => setFormData({ ...formData, term_periods: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grace_periods">Períodos de Gracia</Label>
                  <Input
                    id="grace_periods"
                    type="number"
                    min="0"
                    value={formData.grace_periods}
                    onChange={(e) => setFormData({ ...formData, grace_periods: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_code">Código PUC</Label>
                  <Input
                    id="account_code"
                    value={formData.account_code}
                    onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Calculando..." : "Crear Crédito"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
