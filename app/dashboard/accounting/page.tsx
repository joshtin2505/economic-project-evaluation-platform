"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  FileText,
  Landmark,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchAccountingSummary } from "@/lib/services/accounting-transactions";
import { ensureAccountingSetup } from "@/lib/services/accounting-setup";
import { formatCop } from "@/lib/utils/accounting-format";
import { toast } from "sonner";

export default function AccountingOverviewPage() {
  const [summary, setSummary] = useState({
    monthIncome: 0,
    monthExpense: 0,
    monthProfit: 0,
    unreconciledCount: 0,
    draftInvoicesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        await ensureAccountingSetup();
        const data = await fetchAccountingSummary();
        setSummary(data);
      } catch (err) {
        toast.error("Error al cargar resumen contable");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const modules = [
    {
      title: "Transacciones",
      description: "Registrar ingresos y gastos",
      href: "/dashboard/accounting/transactions",
      icon: Wallet,
    },
    {
      title: "Contactos",
      description: "Clientes y proveedores",
      href: "/dashboard/accounting/contacts",
      icon: Users,
    },
    {
      title: "Facturas",
      description: "Ventas y compras",
      href: "/dashboard/accounting/invoices",
      icon: Receipt,
    },
    {
      title: "Bancos",
      description: "Conciliación bancaria",
      href: "/dashboard/accounting/banks",
      icon: Landmark,
    },
    {
      title: "Reportes",
      description: "Estados financieros",
      href: "/dashboard/accounting/reports",
      icon: FileText,
    },
    {
      title: "DIAN / IVA",
      description: "Cumplimiento fiscal",
      href: "/dashboard/accounting/dian",
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contabilidad</h1>
          <p className="text-muted-foreground">
            Gestión contable integrada con evaluación de proyectos
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/accounting/transactions">
            Nueva transacción
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del mes</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : formatCop(summary.monthIncome)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gastos del mes</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loading ? "..." : formatCop(summary.monthExpense)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utilidad del mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${summary.monthProfit >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {loading ? "..." : formatCop(summary.monthProfit)}
            </div>
          </CardContent>
        </Card>
      </div>

      {(summary.unreconciledCount > 0 || summary.draftInvoicesCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {summary.unreconciledCount > 0 && (
            <Badge variant="secondary">
              {summary.unreconciledCount} movimientos sin conciliar
            </Badge>
          )}
          {summary.draftInvoicesCount > 0 && (
            <Badge variant="outline">
              {summary.draftInvoicesCount} facturas en borrador
            </Badge>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <Link key={mod.href} href={mod.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <mod.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{mod.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {mod.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
