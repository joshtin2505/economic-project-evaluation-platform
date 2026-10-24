"use client";

import React, { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
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
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  type InvestmentDisbursement,
  type DisbursementCategory,
  type DisbursementStatus,
  type ExecutionProgressSummary,
  type CategorySummary,
  CATEGORY_LABELS,
  createDisbursement,
  updateDisbursement,
  deleteDisbursement,
} from "@/lib/services/disbursements";

interface Props {
  projectId: string;
  projectName: string;
  disbursements: InvestmentDisbursement[];
  progress: ExecutionProgressSummary;
  categories: CategorySummary[];
  onRefresh: () => Promise<void>;
}

const STATUS_CONFIG: Record<
  DisbursementStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className: string }
> = {
  pending: { label: "Pendiente", variant: "outline", className: "text-muted-foreground" },
  committed: { label: "Comprometido", variant: "secondary", className: "bg-blue-500/10 text-blue-600 border-blue-200" },
  disbursed: { label: "Desembolsado", variant: "default", className: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  cancelled: { label: "Cancelado", variant: "destructive", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function DisbursementSchedule({
  projectId,
  projectName,
  disbursements,
  progress,
  categories,
  onRefresh,
}: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<InvestmentDisbursement | null>(null);

  // Estado del formulario modal
  const [formData, setFormData] = useState({
    period: 0,
    category: "equipment" as DisbursementCategory,
    description: "",
    planned_amount: 0,
    actual_amount: 0,
    execution_date: "",
    status: "pending" as DisbursementStatus,
    account_code: "",
  });

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData({
      period: 0,
      category: "equipment",
      description: "",
      planned_amount: 0,
      actual_amount: 0,
      execution_date: new Date().toISOString().split("T")[0],
      status: "pending",
      account_code: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: InvestmentDisbursement) => {
    setEditingItem(item);
    setFormData({
      period: item.period,
      category: item.category,
      description: item.description || "",
      planned_amount: Number(item.planned_amount),
      actual_amount: Number(item.actual_amount || 0),
      execution_date: item.execution_date ? item.execution_date.split("T")[0] : "",
      status: item.status,
      account_code: item.account_code || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.planned_amount < 0) {
      toast.error("El monto planificado no puede ser negativo.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateDisbursement(editingItem.id, {
          period: Number(formData.period),
          category: formData.category,
          description: formData.description,
          planned_amount: Number(formData.planned_amount),
          actual_amount: Number(formData.actual_amount || 0),
          execution_date: formData.execution_date || null,
          status: formData.status,
          account_code: formData.account_code,
        });
        toast.success("Desembolso actualizado exitosamente.");
      } else {
        await createDisbursement({
          project_id: projectId,
          period: Number(formData.period),
          category: formData.category,
          description: formData.description,
          planned_amount: Number(formData.planned_amount),
          actual_amount: Number(formData.actual_amount || 0),
          execution_date: formData.execution_date || null,
          status: formData.status,
          account_code: formData.account_code,
        });
        toast.success("Desembolso registrado exitosamente.");
      }

      setIsDialogOpen(false);
      await onRefresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al guardar el desembolso.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este desembolso?")) return;
    try {
      await deleteDisbursement(id);
      toast.success("Desembolso eliminado.");
      await onRefresh();
    } catch (err: any) {
      console.error(err);
      toast.error("Error al eliminar el desembolso.");
    }
  };

  // Preparar datos para el gráfico de barras por período
  const chartData = React.useMemo(() => {
    const periodMap = new Map<number, { periodLabel: string; planned: number; actual: number }>();

    disbursements.forEach((d) => {
      const p = d.period;
      const current = periodMap.get(p) ?? {
        periodLabel: p < 0 ? `Año ${p}` : p === 0 ? "Año 0 (Base)" : `Año ${p}`,
        planned: 0,
        actual: 0,
      };
      current.planned += Number(d.planned_amount || 0);
      current.actual += Number(d.actual_amount || 0);
      periodMap.set(p, current);
    });

    return Array.from(periodMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([, val]) => val);
  }, [disbursements]);

  return (
    <div className="space-y-6">
      {/* 1. Tarjetas de Resumen KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inversión Planificada
            </CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${progress.totalPlanned.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Presupuesto CAPEX programado
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inversión Ejecutada
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${progress.totalActual.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Monto efectivamente desembolsado
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avance de Ejecución
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.progressPercent}%
            </div>
            <Progress value={Math.min(progress.progressPercent, 100)} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Desvío Presupuestal
            </CardTitle>
            <AlertTriangle
              className={`w-4 h-4 ${
                progress.varianceAmount > 0 ? "text-amber-500" : "text-emerald-500"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                progress.varianceAmount > 0
                  ? "text-amber-600"
                  : progress.varianceAmount < 0
                  ? "text-emerald-600"
                  : ""
              }`}
            >
              {progress.varianceAmount >= 0 ? "+" : ""}
              ${progress.varianceAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {progress.variancePercent >= 0 ? "+" : ""}
              {progress.variancePercent}% vs plan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Visualización Gráfica del Cronograma y Desglose por Categoría */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Cronograma Temporal de Desembolsos
            </CardTitle>
            <CardDescription>
              Distribución de inversiones en períodos pre-operativos y operativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                No hay desembolsos registrados en el cronograma.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="periodLabel" tickLine={false} />
                    <YAxis
                      tickFormatter={(val) => `$${Number(val) >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: any) => [`$${Number(val).toLocaleString()}`, ""]}
                      contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px" }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar
                      dataKey="planned"
                      name="Planificado"
                      fill="var(--primary)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="actual"
                      name="Ejecutado"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribución por Categoría */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              CAPEX por Categoría
            </CardTitle>
            <CardDescription>Desglose por tipo de activo e inversión</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Sin categorías registradas
              </p>
            ) : (
              categories.map((c) => {
                const share =
                  progress.totalPlanned > 0
                    ? Math.round((c.plannedAmount / progress.totalPlanned) * 100)
                    : 0;
                return (
                  <div key={c.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{c.categoryLabel}</span>
                      <span className="text-muted-foreground">
                        ${c.plannedAmount.toLocaleString()} ({share}%)
                      </span>
                    </div>
                    <Progress value={share} className="h-1.5" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Tabla Detallada de Desembolsos */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Partidas y Desembolsos</CardTitle>
            <CardDescription>
              Detalle de cada desembolso programado y ejecutado para {projectName}
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Agregar Desembolso
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Período</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Planificado</TableHead>
                  <TableHead className="text-right">Ejecutado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disbursements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No hay desembolsos registrados aún. Haz clic en "Agregar Desembolso" para comenzar.
                    </TableCell>
                  </TableRow>
                ) : (
                  disbursements.map((d) => {
                    const statusCfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.pending;
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="font-semibold">
                          {d.period < 0
                            ? `Año ${d.period}`
                            : d.period === 0
                            ? "Año 0"
                            : `Año ${d.period}`}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium">
                            {CATEGORY_LABELS[d.category] || d.category}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">
                          {d.description || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${Number(d.planned_amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-600">
                          ${Number(d.actual_amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusCfg.variant} className={statusCfg.className}>
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {d.execution_date
                            ? new Date(d.execution_date).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => openEditDialog(d)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(d.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Dialog para Crear / Editar Desembolso */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Desembolso de Inversión" : "Nuevo Desembolso de Inversión"}
              </DialogTitle>
              <DialogDescription>
                Define el período, la categoría de gasto de capital y el estado de ejecución.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period">
                    Período / Año <span className="text-xs text-muted-foreground">(&le; 0 para pre-inversión)</span>
                  </Label>
                  <Input
                    id="period"
                    type="number"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría CAPEX</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val: DisbursementCategory) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecciona categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción / Concepto</Label>
                <Input
                  id="description"
                  placeholder="ej. Compra de compresores y generadores"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planned_amount">Monto Planificado ($)</Label>
                  <Input
                    id="planned_amount"
                    type="number"
                    min="0"
                    step="any"
                    value={formData.planned_amount}
                    onChange={(e) => setFormData({ ...formData, planned_amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actual_amount">Monto Ejecutado Real ($)</Label>
                  <Input
                    id="actual_amount"
                    type="number"
                    min="0"
                    step="any"
                    value={formData.actual_amount}
                    onChange={(e) => setFormData({ ...formData, actual_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado del Desembolso</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val: DisbursementStatus) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="committed">Comprometido</SelectItem>
                      <SelectItem value="disbursed">Desembolsado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="execution_date">Fecha de Ejecución</Label>
                  <Input
                    id="execution_date"
                    type="date"
                    value={formData.execution_date}
                    onChange={(e) => setFormData({ ...formData, execution_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_code">
                  Código Contable PUC <span className="text-xs text-muted-foreground">(Opcional, ej: 1520)</span>
                </Label>
                <Input
                  id="account_code"
                  placeholder="ej. 1520 - Maquinaria y equipo"
                  value={formData.account_code}
                  onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : editingItem ? "Actualizar" : "Crear Desembolso"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
