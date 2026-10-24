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
  LineChart,
  Line,
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
  Building2,
  Plus,
  Trash2,
  DollarSign,
  TrendingDown,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import * as assetsService from "@/lib/services/assets";
import { routes } from "@/lib/routes";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProjectAssetsPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [overview, setOverview] = useState<assetsService.ProjectAssetsOverview | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal para crear activo
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "equipment" as assetsService.AssetCategory,
    acquisition_cost: 30000,
    salvage_value: 3000,
    useful_life_periods: 5,
    depreciation_method: "straight_line" as assetsService.ProjectAssetRecord["depreciation_method"],
    acquisition_period: 0,
    account_code_asset: "1520",
    account_code_depreciation: "5260",
    account_code_accumulated: "1592",
  });

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await assetsService.fetchProjectAssetsOverview(id);
      setOverview(data);

      if (data.assets.length > 0) {
        const fullAsset = await assetsService.fetchAssetWithDepreciation(data.assets[0].id);
        setSelectedAsset(fullAsset);
      } else {
        setSelectedAsset(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar activos del proyecto.");
      toast.error("Error al cargar activos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

  const handleSelectAsset = async (assetId: string) => {
    try {
      const full = await assetsService.fetchAssetWithDepreciation(assetId);
      setSelectedAsset(full);
    } catch (err: any) {
      toast.error("Error al cargar cronograma de depreciación.");
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await assetsService.createAsset({
        project_id: id,
        name: formData.name,
        category: formData.category,
        acquisition_cost: Number(formData.acquisition_cost),
        salvage_value: Number(formData.salvage_value || 0),
        useful_life_periods: Number(formData.useful_life_periods),
        depreciation_method: formData.depreciation_method,
        acquisition_period: Number(formData.acquisition_period || 0),
        account_code_asset: formData.account_code_asset,
        account_code_depreciation: formData.account_code_depreciation,
        account_code_accumulated: formData.account_code_accumulated,
      });

      toast.success("Activo registrado y cronograma de depreciación generado.");
      setIsDialogOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al registrar activo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("¿Deseas eliminar este activo fijo?")) return;
    try {
      await assetsService.deleteAsset(assetId);
      toast.success("Activo eliminado.");
      await loadData();
    } catch (err: any) {
      toast.error("Error al eliminar activo.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando activos y tablas de depreciación...</p>
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

  // Gráfico de Valor en Libros vs Tiempo para el activo seleccionado
  const chartData = selectedAsset?.depreciationSchedule
    ? [
        {
          period: `Año ${selectedAsset.acquisition_period}`,
          valorLibros: Number(selectedAsset.acquisition_cost),
          depreciacionAnual: 0,
        },
        ...selectedAsset.depreciationSchedule.map((row: any) => ({
          period: `Año ${row.period}`,
          valorLibros: row.bookValue,
          depreciacionAnual: row.depreciationExpense,
        })),
      ]
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
            <span className="text-foreground font-medium">Activos & Depreciación</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Activos Fijos y Depreciación
            </h1>
            <Badge variant="outline" className="text-xs">
              <Building2 className="w-3 h-3 mr-1 text-primary" />
              Gestión de Activos
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Control de activos fijos, métodos contables de depreciación (Línea Recta, Saldos Decrecientes, Suma de Años) y evolución del valor en libros.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Activo
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.projectProForma(id)}>
              Ver Estado Pro-Forma
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Tarjetas KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Costo Total Activos Fijos
            </CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${overview.totalAcquisitionCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.assets.length} activos registrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Base Depreciable
            </CardTitle>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              ${overview.totalDepreciableBase.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Costo total menos valor de salvamento
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor de Salvamento Total
            </CardTitle>
            <Layers className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${overview.totalSalvageValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor de rescate al final de la vida útil
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Depreciación Promedio Anual
            </CardTitle>
            <Building2 className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(
                Array.from(overview.annualDepreciationByPeriod.values()).reduce((a, b) => a + b, 0) /
                  Math.max(overview.annualDepreciationByPeriod.size, 1),
              ).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Impacto periódico en Estado de Resultados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Lista de Activos */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Catálogo de Activos del Proyecto</CardTitle>
          <CardDescription>
            Haz clic en un activo para inspeccionar su tabla de depreciación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Activo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Costo Adquisición</TableHead>
                  <TableHead className="text-right">Salvamento</TableHead>
                  <TableHead className="text-right">Vida Útil</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Cuenta PUC</TableHead>
                  <TableHead className="text-right w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.assets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No hay activos registrados. Agrega un activo fijo para calcular su depreciación periódica.
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.assets.map((asset) => (
                    <TableRow
                      key={asset.id}
                      className={`cursor-pointer transition-colors ${
                        selectedAsset?.id === asset.id ? "bg-muted/70 font-medium" : ""
                      }`}
                      onClick={() => handleSelectAsset(asset.id)}
                    >
                      <TableCell className="font-semibold flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        {asset.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {assetsService.ASSET_CATEGORY_LABELS[asset.category] || asset.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${Number(asset.acquisition_cost).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600">
                        ${Number(asset.salvage_value).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{asset.useful_life_periods} años</TableCell>
                      <TableCell className="capitalize text-xs">
                        {asset.depreciation_method === "straight_line"
                          ? "Línea Recta"
                          : asset.depreciation_method === "declining_balance"
                          ? "Saldos Decrecientes"
                          : "Suma de Años"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {asset.account_code_asset || "1520"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteAsset(asset.id);
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

      {/* 4. Tabla y Gráfico de Depreciación del Activo Seleccionado */}
      {selectedAsset && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                Cronograma de Depreciación: {selectedAsset.name}
              </CardTitle>
              <CardDescription>
                Gasto por depreciación anual, depreciación acumulada y valor en libros residual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Período</TableHead>
                      <TableHead className="text-right">Gasto Depreciación</TableHead>
                      <TableHead className="text-right">Deprec. Acumulada</TableHead>
                      <TableHead className="text-right">Valor en Libros</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedAsset.depreciationSchedule.map((row: any) => (
                      <TableRow key={row.period}>
                        <TableCell className="font-semibold">Año {row.period}</TableCell>
                        <TableCell className="text-right font-medium text-amber-600">
                          ${row.depreciationExpense.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium text-muted-foreground">
                          ${row.accumulatedDepreciation.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold text-foreground">
                          ${row.bookValue.toLocaleString()}
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
              <CardTitle className="text-base">Evolución de Valor en Libros</CardTitle>
              <CardDescription>Disminución patrimonial en el tiempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
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
                    <Line
                      type="monotone"
                      dataKey="valorLibros"
                      name="Valor en Libros"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Dialog para Registrar Activo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleCreateAsset}>
            <DialogHeader>
              <DialogTitle>Registrar Activo Depreciable</DialogTitle>
              <DialogDescription>
                Ingresa el costo inicial, vida útil y método contable de depreciación.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Activo</Label>
                <Input
                  id="name"
                  placeholder="ej. Centro de Mecanizado CNC"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val: any) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(assetsService.ASSET_CATEGORY_LABELS).map(([k, label]) => (
                        <SelectItem key={k} value={k}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depreciation_method">Método Depreciación</Label>
                  <Select
                    value={formData.depreciation_method}
                    onValueChange={(val: any) => setFormData({ ...formData, depreciation_method: val })}
                  >
                    <SelectTrigger id="depreciation_method">
                      <SelectValue placeholder="Método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="straight_line">Línea Recta</SelectItem>
                      <SelectItem value="declining_balance">Saldos Decrecientes (2x)</SelectItem>
                      <SelectItem value="sum_of_years">Suma de Dígitos Años</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="acquisition_cost">Costo Adquisición ($)</Label>
                  <Input
                    id="acquisition_cost"
                    type="number"
                    min="1"
                    value={formData.acquisition_cost}
                    onChange={(e) => setFormData({ ...formData, acquisition_cost: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salvage_value">Valor Salvamento ($)</Label>
                  <Input
                    id="salvage_value"
                    type="number"
                    min="0"
                    value={formData.salvage_value}
                    onChange={(e) => setFormData({ ...formData, salvage_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="useful_life_periods">Vida Útil (Años)</Label>
                  <Input
                    id="useful_life_periods"
                    type="number"
                    min="1"
                    value={formData.useful_life_periods}
                    onChange={(e) => setFormData({ ...formData, useful_life_periods: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_code_asset">Código PUC Activo</Label>
                  <Input
                    id="account_code_asset"
                    value={formData.account_code_asset}
                    onChange={(e) => setFormData({ ...formData, account_code_asset: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Calculando..." : "Crear Activo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
